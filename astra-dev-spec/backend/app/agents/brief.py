from datetime import date, timedelta

from app.db.models import Brief, PolicyDocument, RuleDraft, RuleVersion, TriageRecord
from app.db.store import rows
from app.engine.adapter import current_impacts, watches
from app.engine.changes import brief_totals
from app.settings import now


def build_brief(session, settings):
    _, impacts = current_impacts(session, settings)
    items = []
    for w in watches(session, settings):
        if w["next_milestone"] and settings.today < date.fromisoformat(w["next_milestone"]) <= settings.today + timedelta(days=30):
            items.append(dict(kind="expiry" if w["legal_status"] == "scheduled_expiry" else "watch", title=w["title"], original_title=None,
                 legal_status=w["legal_status"], summary=w["summary"], affected_order_ids=w["affected_order_ids"], impact_usd=w["impact_usd"],
                 source_url=w["sources"][0] if w["sources"] else None, published_at=None, confirmed=True, draft_status=None))
    items.sort(key=lambda i: i["kind"] != "expiry")
    docs = [d for d in rows(session, PolicyDocument) if d.business_date == str(settings.today)]
    docs.sort(key=lambda d: (d.payload["is_public_inspection"], -(date.fromisoformat(d.payload["publication_date"]).toordinal()) if d.payload.get("publication_date") else 0, d.id))
    for doc in docs:
        triage = session.get(TriageRecord, doc.id)
        if not triage or not triage.payload["relevant"]:
            continue
        t, value = triage.payload, doc.payload
        draft_record = session.get(RuleDraft, f"DRAFT-{doc.id}")
        draft = draft_record.payload if draft_record else None
        summary = draft["summary_zh"] if draft else t["one_line_zh"]
        if t["category"] == "adcvd":
            summary += "（反倾销/反补贴，不计算）"
        items.append(dict(kind="preview_alert" if value["is_public_inspection"] else "policy", title=t["one_line_zh"], original_title=value["title"],
             legal_status=t["legal_status"], summary=summary, affected_order_ids=[],
             impact_usd=draft["impact_preview"]["profit_delta_usd"] if draft and draft["status"] == "draft" and draft["impact_preview"] else None,
             source_url=value.get("html_url"), published_at=value.get("publication_date"), confirmed=not draft or draft["status"] == "approved",
             draft_status=draft["status"] if draft else None))
    changed = any(r.business_date == str(settings.today) and r.source != "seed" and r.change_type in ("program_add", "program_update", "hts_profile_update") for r in rows(session, RuleVersion))
    summary, count, money = brief_totals(impacts)
    value = dict(date=str(settings.today), generated_at=now(), conclusion=f"今天{'有' if changed else '没有'}新的已生效税率变化。待处理红色订单 {count} 单，合计利润变化 {money}。", items=items, order_summary=summary)
    existing = session.get(Brief, str(settings.today))
    if existing:
        existing.payload = value
    else:
        session.add(Brief(id=str(settings.today), business_date=str(settings.today), payload=value))
    session.flush()
    return value
