"""System knowledge is a read model; manual edits never modify engine inputs."""
from sqlalchemy import text

from app.db import models as m
from app.db.store import build_snapshot, rows
from app.engine.i18n import LEGAL, RISK, STATUS, LAYERS_EN, impact_text, watch_text
from app.settings import now


def money(value, signed=False):
    return f'{"−" if value < 0 else "+" if signed else ""}${abs(value):,.2f}'


def index_entry(session, entry):
    session.execute(text("DELETE FROM kb_fts WHERE id=:id"), {"id": entry["id"]})
    session.execute(text("INSERT INTO kb_fts (id,title_zh,body_zh,title_en,body_en) VALUES (:id,:title_zh,:body_zh,:title_en,:body_en)"), entry)


def init_fts(session):
    session.execute(text("CREATE VIRTUAL TABLE IF NOT EXISTS kb_fts USING fts5(id UNINDEXED,title_zh,body_zh,title_en,body_en,tokenize='trigram')"))


def sync_kb(session, settings):
    from app.engine.adapter import LAYER_LABELS
    init_fts(session)
    session.flush()
    today, generated = str(settings.today), {}
    snapshot = build_snapshot(session)

    def add(kind, ref, zh, en, day=today):
        generated[f"{kind}:{ref}"] = dict(source_type=kind, business_date=day,
            title_zh=zh[0], body_zh=zh[1], title_en=en[0], body_en=en[1])

    for wid, w in snapshot["watch_items"].items():
        content = []
        for lang in ("zh", "en"):
            title, summary = watch_text(session, wid, w, lang)
            content.append((title, summary + ("\n下一节点：" if lang == "zh" else "\nNext milestone: ") + (w.get("next_milestone") or ("无" if lang == "zh" else "None"))))
        add("watch", wid, *content)
    for p in snapshot["programs"]:
        values = []
        for lang in ("zh", "en"):
            zh = lang == "zh"
            title = (LAYER_LABELS if zh else LAYERS_EN).get(p["id"], p["name"])
            body = (f'税率 {p["rate_pct"]}%\n第99章税号 {p["heading"]}\n适用入境日 {p.get("valid_from")} 至 {p.get("valid_to") or "无截止"}\n来源：' if zh else
                    f'Rate {p["rate_pct"]}%\nChapter 99 heading {p["heading"]}\nEntry dates {p.get("valid_from")} to {p.get("valid_to") or "No end date"}\nSources: ')
            values.append((title, body + " ".join(p.get("sources", []))))
        add("rule", p["id"], *values)
    for doc in rows(session, m.PolicyDocument):
        triage = session.get(m.TriageRecord, doc.id)
        if not triage or not triage.payload["relevant"]:
            continue
        d, t = doc.payload, triage.payload
        draft = session.get(m.RuleDraft, f"DRAFT-{doc.id}")
        content = []
        for lang in ("zh", "en"):
            zh = lang == "zh"
            title = t.get("one_line_" + lang) or t["one_line_zh"]
            summary = (draft.payload.get("summary_" + lang) or draft.payload["summary_zh"]) if draft else title
            legal = LEGAL.get(t["legal_status"], ("无", "None"))[not zh]
            status = STATUS[draft.payload["status"]][not zh] if draft else ("无" if zh else "None")
            body = (f'法律状态：{legal}\n原文标题：{d["title"]}\n发布日期：{d.get("publication_date")}\n摘要：{summary}\n草稿状态：{status}\n原文：{d.get("html_url")}' if zh else
                    f'Legal status: {legal}\nOriginal title: {d["title"]}\nPublication date: {d.get("publication_date")}\nSummary: {summary}\nDraft status: {status}\nSource: {d.get("html_url")}')
            content.append((title, body))
        add("policy", doc.id, *content, day=doc.business_date)
    for b in rows(session, m.Brief):
        v = b.payload
        add("brief", b.id, (f"美国关税政策日报 · {b.id}", v["conclusion"].split("。")[0] + "。\n" + "\n".join("- " + i["title"] for i in v["items"])),
            (f"U.S. Tariff Policy Brief · {b.id}", v.get("conclusion_en", v["conclusion"]).split(". ")[0] + ".\n" + "\n".join("- " + i.get("title_en", i["title"]) for i in v["items"])), day=b.id)
    for o in rows(session, m.Order):
        v = o.payload
        fields = [("贸易术语", "Incoterm", "incoterm"), ("渠道", "Channel", "channel"), ("税号", "HTS", "hts10"),
                  ("数量", "Quantity", "qty"), ("单价", "Unit price", "unit_price_usd"), ("完税价格", "Customs value", "customs_value_usd"),
                  ("装船日", "Load date", "load_date"), ("预计入境日", "Entry date", "entry_date"), ("状态", "Status", "status")]
        vals = []
        for lang in ("zh", "en"):
            lines = []
            for zh, en, key in fields:
                val = v[key]
                if key.endswith("_usd"):
                    val = money(val)
                elif key == "channel":
                    val = "B2B" if val == "b2b" else "电商" if lang == "zh" else "E-commerce"
                elif key == "status":
                    val = dict(quoted=("已报价", "Quoted"), confirmed=("已确认", "Confirmed"), shipped=("已发货", "Shipped"), entered=("已入境", "Entered"))[val][lang == "en"]
                lines.append(f'{zh if lang == "zh" else en}：{val}')
            vals.append((f'{"订单" if lang == "zh" else "Order"} {o.id} · {v["product"]}', "\n".join(lines)))
        add("order", o.id, *vals)
    runs = rows(session, m.ImpactRun)
    run = max(runs, key=lambda r: r.payload["created_at"]) if runs else None
    for i in rows(session, m.Impact):
        if not run or i.run_id != run.id:
            continue
        raw = i.payload
        values = []
        for lang in ("zh", "en"):
            v = impact_text({**raw, "layers": []}, lang, session, snapshot)
            risk = v["risk_level"] if lang == "zh" else RISK[v["risk_level"]]
            title = f'{"影响单" if lang == "zh" else "Impact sheet"} {i.order_id} · {risk}'
            body = (f'订单 {i.order_id} {v["product"]}（HTS {v["hts10"]}，{v["incoterm"]}）：风险 {risk}；新税率 {v["rate_new_pct"]:.1f}%（基准 {v["rate_baseline_user_pct"]:.1f}%）；关税增量 {money(v["duty_delta_usd"], True)}；利润 {money(v["seller_profit_baseline_usd"])} → {money(v["seller_profit_new_usd"])}（变化 {money(v["profit_delta_usd"], True)}）\n原因：{v["risk_reasons"]}' if lang == "zh" else
                    f'Order {i.order_id} {v["product"]} (HTS {v["hts10"]}, {v["incoterm"]}): risk {risk}; new rate {v["rate_new_pct"]:.1f}% (baseline {v["rate_baseline_user_pct"]:.1f}%); duty change {money(v["duty_delta_usd"], True)}; profit {money(v["seller_profit_baseline_usd"])} → {money(v["seller_profit_new_usd"])} (change {money(v["profit_delta_usd"], True)})\nReason: {v["risk_reasons"]}')
            values.append((title, body + "\n" + "\n".join(f"{j+1:02}. {a}" for j, a in enumerate(v["actions"])) ))
        add("impact", i.order_id, *values)
    for key, value in generated.items():
        record = session.get(m.KbEntry, key)
        old = dict(record.payload) if record else dict(id=key, created_at=now(), edited_zh=False, edited_en=False, source_changed=False)
        changed = False
        for lang in ("zh", "en"):
            for field in ("title", "body"):
                name = field + "_" + lang
                if old.get("edited_" + lang):
                    changed |= old.get("auto_" + name) != value[name]
                else:
                    old[name] = value[name]
                old["auto_" + name] = value[name]
        old.update(source_type=value["source_type"], business_date=value["business_date"], sensitive=value["source_type"] in ("order", "impact"), editable=value["source_type"] not in ("order", "impact"), source_changed=old["source_changed"] or changed)
        if not record or old != record.payload:
            old["updated_at"] = now()
            if record:
                record.payload = old
            else:
                session.add(m.KbEntry(id=key, business_date=value["business_date"], payload=old))
            index_entry(session, old)
    for record in rows(session, m.KbEntry):
        if record.payload["source_type"] != "manual" and record.id not in generated:
            session.execute(text("DELETE FROM kb_fts WHERE id=:id"), {"id": record.id})
            session.delete(record)
    session.flush()


def search(session, q="", kind=None, include_sensitive=False, limit=50, offset=0):
    candidates = [e.payload for e in rows(session, m.KbEntry) if (include_sensitive or not e.payload["sensitive"]) and (not kind or e.payload["source_type"] == kind)]
    terms = q.split()
    long = [t for t in terms if len(t) >= 3]
    ranked = None
    if long:
        phrase = " AND ".join('"' + t.replace('"', '""') + '"' for t in long)
        ranked = {row[0]: row[1] for row in session.execute(text("SELECT id,bm25(kb_fts) FROM kb_fts WHERE kb_fts MATCH :q"), {"q": phrase})}
        candidates = [v for v in candidates if v["id"] in ranked]
    for term in terms:
        if len(term) < 3:
            candidates = [v for v in candidates if any(term.lower() in v[c].lower() for c in ("title_zh", "body_zh", "title_en", "body_en"))]
    candidates.sort(key=(lambda v: ranked[v["id"]]) if ranked is not None else (lambda v: v["updated_at"]), reverse=ranked is None)
    return candidates[offset:offset+limit]
