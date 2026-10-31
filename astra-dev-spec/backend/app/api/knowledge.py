from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import text

from app.api.errors import ApiException
from app.api.routes import missing, session_dep, settings_dep
from app.audit.service import append
from app.db.models import KbEntry
from app.knowledge.service import index_entry, search
from app.settings import now

router = APIRouter(prefix="/api/kb")
Lang = Literal["zh", "en"]


class Edit(BaseModel):
    lang: Lang
    title: str
    body: str


class Restore(BaseModel):
    lang: Lang


class Create(BaseModel):
    title_zh: str = ""
    body_zh: str = ""
    title_en: str = ""
    body_en: str = ""


def get_entry(session, key):
    record = session.get(KbEntry, key)
    if not record:
        missing("知识条目", key)
    return record


@router.get("")
def entries(type: str | None = None, q: str = "", lang: Lang = "zh", include_sensitive: bool = False,
            limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0), session=Depends(session_dep)):
    return [dict(id=v["id"], source_type=v["source_type"], title=v["title_"+lang], snippet=v["body_"+lang][:120],
                 sensitive=v["sensitive"], editable=v["editable"], edited=v["edited_"+lang],
                 source_changed=v["source_changed"], updated_at=v["updated_at"])
            for v in search(session, q, type, include_sensitive, limit, offset)]


@router.post("")
def create(body: Create, session=Depends(session_dep), settings=Depends(settings_dep)):
    if not any(getattr(body, "title_"+lang).strip() and getattr(body, "body_"+lang).strip() for lang in ("zh", "en")):
        raise ApiException(400, "BAD_REQUEST", "请求参数不合法")
    value = dict(id=f"manual:{uuid4()}", source_type="manual", sensitive=False, editable=True,
                 **body.model_dump(), edited_zh=bool(body.title_zh), edited_en=bool(body.title_en), source_changed=False,
                 created_at=now(), updated_at=now(), business_date=str(settings.today),
                 auto_title_zh=None, auto_body_zh=None, auto_title_en=None, auto_body_en=None)
    session.add(KbEntry(id=value["id"], business_date=str(settings.today), payload=value))
    index_entry(session, value)
    append(session, str(settings.today), "KB_CREATED", "本地用户", value["id"], f'{value["id"]} · 新建知识')
    return value


@router.get("/{key}")
def detail(key: str, session=Depends(session_dep)):
    return get_entry(session, key).payload


@router.put("/{key}")
def edit(key: str, body: Edit, session=Depends(session_dep), settings=Depends(settings_dep)):
    record = get_entry(session, key)
    if not record.payload["editable"]:
        raise ApiException(409, "CONFLICT", "系统生成的条目不能编辑")
    if not body.title.strip() or not body.body.strip():
        raise ApiException(400, "BAD_REQUEST", "请求参数不合法")
    record.payload = {**record.payload, "title_"+body.lang: body.title, "body_"+body.lang: body.body,
                      "edited_"+body.lang: True, "source_changed": False, "updated_at": now()}
    index_entry(session, record.payload)
    append(session, str(settings.today), "KB_EDITED", "本地用户", key, f"{key} · 编辑知识")
    return record.payload


@router.post("/{key}/restore")
def restore(key: str, body: Restore, session=Depends(session_dep), settings=Depends(settings_dep)):
    record = get_entry(session, key)
    if not record.payload["editable"] or record.payload["source_type"] == "manual":
        raise ApiException(409, "CONFLICT", "系统生成的条目不能编辑")
    v = dict(record.payload)
    v.update({"title_"+body.lang: v["auto_title_"+body.lang], "body_"+body.lang: v["auto_body_"+body.lang],
              "edited_"+body.lang: False, "updated_at": now()})
    if not v["edited_zh"] and not v["edited_en"]:
        v["source_changed"] = False
    record.payload = v
    index_entry(session, v)
    append(session, str(settings.today), "KB_RESTORED", "本地用户", key, f"{key} · 恢复知识")
    return v


@router.delete("/{key}")
def delete(key: str, session=Depends(session_dep), settings=Depends(settings_dep)):
    record = get_entry(session, key)
    if record.payload["source_type"] != "manual":
        raise ApiException(409, "CONFLICT", "系统生成的条目不能删除")
    session.delete(record)
    session.execute(text("DELETE FROM kb_fts WHERE id=:id"), {"id": key})
    append(session, str(settings.today), "KB_DELETED", "本地用户", key, f"{key} · 删除知识")
    return {"deleted": True}
