import json
import re
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.agents.llm_client import HttpLLMClient
from app.api.errors import ApiException
from app.api.routes import missing, session_dep, settings_dep
from app.audit.service import append
from app.collectors.service import read_fixture
from app.db import models as m
from app.db.store import rows
from app.knowledge.service import search
from app.settings import ROOT, now

router = APIRouter(prefix="/api/chat/conversations")


class MessageRequest(BaseModel):
    text: str = Field(min_length=1, max_length=24000)
    lang: Literal["zh", "en"] = "zh"
    use_order_data: bool = False


class ChatResult(BaseModel):
    answer: str
    citations: list[str]


def conversation(session, key):
    record = session.get(m.ChatConversation, key)
    if not record:
        missing("对话", key)
    return record


def message(session, settings, cid, role, text, citations=None, guard=None, import_job_id=None):
    value = dict(id=uuid4().hex, role=role, text=text, citations=citations or [], guard=guard,
                 import_job_id=import_job_id, created_at=now())
    session.add(m.ChatMessage(id=value["id"], business_date=str(settings.today), payload=value, conversation_id=cid))
    return value


@router.post("")
def create(session=Depends(session_dep), settings=Depends(settings_dep)):
    key = uuid4().hex
    session.add(m.ChatConversation(id=key, business_date=str(settings.today), payload=dict(id=key, created_at=now())))
    return {"id": key}


@router.get("/latest")
def latest(session=Depends(session_dep)):
    values = rows(session, m.ChatConversation)
    if not values:
        missing("对话", "latest")
    record = max(values, key=lambda r: r.payload["created_at"])
    return {**record.payload, "messages": [r.payload for r in rows(session, m.ChatMessage) if r.conversation_id == record.id]}


def unknown_numbers(answer, question, context):
    source = question + "\n" + "\n".join(v["title"] + "\n" + v["body"] for v in context)
    return list(dict.fromkeys(n for n in re.findall(r"\d+(?:[.,:\-]\d+)*", answer) if n not in source))


@router.post("/{key}/messages")
def send(key: str, body: MessageRequest, session=Depends(session_dep), settings=Depends(settings_dep)):
    conversation(session, key)
    if not body.text.strip():
        raise ApiException(400, "BAD_REQUEST", "请求参数不合法")
    config = session.get(m.LlmSettings, "local")
    fixture = read_fixture("llm/chat.json").get(body.text.strip().lower()) if not config else None
    candidates = []
    if fixture:
        candidates = [e.payload for cid in fixture["citations"] if (e := session.get(m.KbEntry, cid)) and (body.use_order_data or not e.payload["sensitive"])]
    elif config:
        if body.use_order_data:
            for order in rows(session, m.Order):
                if re.search(r"(?<!\w)" + re.escape(order.id) + r"(?!\w)", body.text, re.I):
                    candidates.extend(e.payload for kind in ("impact", "order") if (e := session.get(m.KbEntry, kind+":"+order.id)))
        candidates.extend(search(session, body.text, include_sensitive=body.use_order_data, limit=8))
    context, seen, length = [], set(), 0
    sensitive = []
    for v in candidates:
        if v["id"] in seen or len(context) == 8:
            continue
        title, text = v["title_"+body.lang], v["body_"+body.lang]
        size = len(v["id"]) + len(title) + len(text) + 5
        if length + size > 24000:
            break
        context.append(dict(id=v["id"], title=title, body=text))
        seen.add(v["id"])
        length += size
        if v["sensitive"]:
            sensitive.append(v["id"])
    if sensitive:
        model = config.payload["model"] if config else "内置夹具"
        append(session, str(settings.today), "CHAT_ORDER_DATA_SENT", "本地用户", key, f'对话向模型 {model} 发送订单数据：{", ".join(sensitive)}')
        # Persist consent evidence even if the external request fails.
    if config:
        client = HttpLLMClient(config.payload)
        user = json.dumps(dict(question=body.text, lang=body.lang, context=context), ensure_ascii=False)
        system = (ROOT / "backend/app/agents/prompts/chat_v1.md").read_text(encoding="utf-8")
        try:
            result = client.complete_json(system=system, user=user, schema=ChatResult, fixture_key="", role="chat").model_dump()
            unknown = unknown_numbers(result["answer"], body.text, context)
            if unknown:
                user += f'\n回答中出现了上下文里没有的数字：{", ".join(unknown)}。只能使用上下文中的数字。'
                result = client.complete_json(system=system, user=user, schema=ChatResult, fixture_key="", role="chat").model_dump()
        except ValueError as exc:
            session.commit()
            raise ApiException(502, "MODEL_ERROR", str(exc)) from None
    elif fixture:
        result = fixture
    else:
        result = dict(answer="未配置模型，且没有该问题的内置答案。请先到「模型接入」页配置模型。" if body.lang == "zh" else "No model is configured and this question has no built-in answer. Configure a model on Model Access first.", citations=[])
    unknown = unknown_numbers(result["answer"], body.text, context)
    citations = [dict(id=v["id"], title=v["title"]) for v in context if v["id"] in result["citations"]]
    return dict(user=message(session, settings, key, "user", body.text),
                assistant=message(session, settings, key, "assistant", result["answer"], citations, dict(ok=not unknown, unknown_numbers=unknown)))
