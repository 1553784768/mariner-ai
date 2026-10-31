import time
from typing import Literal
from urllib.parse import urlparse

from fastapi import APIRouter, Depends
from pydantic import RootModel

from app.agents.llm_client import HttpLLMClient
from app.api import schemas as s
from app.api.errors import ApiException
from app.api.routes import session_dep, settings_dep
from app.audit.service import append
from app.db.models import LlmSettings
from app.settings import now
from app.localization import translate

router = APIRouter(prefix="/api/settings/llm")


def public_settings(record, lang="zh"):
    if not record:
        return dict(configured=False, base_url=None, model=None, api_key_masked=None, last_test=None)
    value = record.payload
    last_test = value.get("last_test")
    if last_test and lang == "en":
        last_test = {**last_test, "message": translate(last_test["message"])}
    return dict(configured=True, base_url=value["base_url"], model=value["model"],
                api_key_masked="****" + value["api_key"][-4:], last_test=last_test)


@router.get("", response_model=s.LlmSettings)
def get_settings(lang: Literal["zh", "en"] = "zh", session=Depends(session_dep)):
    return public_settings(session.get(LlmSettings, "local"), lang)


@router.put("", response_model=s.LlmSettings)
def save_settings(body: s.LlmSettingsRequest, session=Depends(session_dep), settings=Depends(settings_dep)):
    record = session.get(LlmSettings, "local")
    key = body.api_key if body.api_key is not None else record.payload["api_key"] if record else None
    parsed = urlparse(body.base_url)
    if not key or not body.model.strip() or parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.query or parsed.fragment:
        raise ApiException(400, "BAD_REQUEST", "请求参数不合法")
    payload = dict(base_url=body.base_url.rstrip("/"), model=body.model, api_key=key, last_test=None)
    if record:
        record.payload = payload
    else:
        record = LlmSettings(id="local", business_date=str(settings.today), payload=payload)
        session.add(record)
    append(session, str(settings.today), "LLM_SETTINGS_CHANGED", "本地用户", "llm_settings", f"模型配置已保存：{body.model}")
    return public_settings(record)


@router.delete("", response_model=s.LlmSettings)
def clear_settings(session=Depends(session_dep), settings=Depends(settings_dep)):
    record = session.get(LlmSettings, "local")
    if record:
        session.delete(record)
    append(session, str(settings.today), "LLM_SETTINGS_CHANGED", "本地用户", "llm_settings", "模型配置已清除")
    return public_settings(None)


@router.post("/test", response_model=s.TestConnection)
def test_settings(lang: Literal["zh", "en"] = "zh", session=Depends(session_dep)):
    record = session.get(LlmSettings, "local")
    if record is None:
        raise ApiException(400, "BAD_REQUEST", "请求参数不合法")
    class Ping(RootModel[object]):
        pass
    start = time.monotonic()
    try:
        result = HttpLLMClient(record.payload).complete_json(system='Reply with the JSON object {"ok": true}.',
                 user="ping", schema=Ping, fixture_key="", role="triage")
        ok = result.root == {"ok": True} and isinstance(result.root.get("ok"), bool)
        message = "连接成功" if ok else '模型已响应，但返回内容不是 {"ok": true}'
    except (ValueError, KeyError) as exc:
        ok, message = False, str(exc)
    latency = round((time.monotonic() - start) * 1000, 2)
    value = dict(ok=ok, message=message, latency_ms=latency)
    record.payload = {**record.payload, "last_test": {**value, "at": now()}}
    return {**value, "message": translate(message) if lang == "en" else message}
