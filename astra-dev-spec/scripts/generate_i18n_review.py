"""Build the bilingual review inventory from dictionaries and backend templates."""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.engine import i18n
from app.engine.adapter import LAYER_LABELS, WATCH_TEXT
from app.localization import AUDIT_TEMPLATES, ERROR_TEMPLATES, RESOURCES_EN, TEXT


def frontend_messages():
    code = """
const fs = require('fs'), ts = require('typescript'), vm = require('vm');
const source = fs.readFileSync('src/i18n/en.ts', 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}});
const scope = {exports: {}};
vm.runInNewContext(compiled.outputText, scope);
process.stdout.write(JSON.stringify(scope.exports.default));
"""
    result = subprocess.run(["node", "-e", code], cwd=ROOT / "frontend", check=True,
                            capture_output=True, encoding="utf-8")
    return json.loads(result.stdout)


def cell(value):
    return str(value).replace("&", "&amp;").replace("<", "&lt;").replace("|", "&#124;").replace("\n", "<br>")


def section(title, rows):
    output = [f"\n## {title}\n", "| 编号 / 来源 | 中文 | English |", "|---|---|---|"]
    output += ["| " + " | ".join(map(cell, row)) + " |" for row in rows]
    return "\n".join(output) + "\n"


def main():
    messages = frontend_messages()
    output = ["# v0.2 英文文案审阅清单\n",
              "生成日期：2026-10-31。全部条目均为实现中的当前文案，供用户审阅；生成清单不等于人工批准译文。\n",
              ("术语依据 `V02_SPEC.md` §7.6。`{...}` 为运行时参数，金额、日期、税率保持原值。"
              "以下覆盖 `frontend/src/i18n/en.ts` 的全部键值，以及后端引擎、错误、审计、知识库、日报和内置双语内容。"
              "原文标题、来源正文、产品名称、文件名、用户输入、旧记录缺失译文的原文按规格保留；"
              "API 字段名、枚举 key、日志和模型提示词属于技术内容，不作为界面译文列入。"
              "种子及夹具中的关税事件是项目演示快照，本清单没有独立核实其现实有效性。\n"),
              ("重新生成：`backend/.venv/Scripts/python.exe scripts/generate_i18n_review.py`"
              "（Linux 使用对应 venv Python；需要已安装前端依赖）。\n")]
    output.append(section(f"前端字典（{len(messages)} 项，完整）",
                          [(f"UI-{i:03}", zh, en) for i, (zh, en) in enumerate(messages.items(), 1)]))
    rows = []
    for kind, templates in i18n.TEMPLATES.items():
        rows += [(f"{kind}/{v['code']}", v["zh"], v["en"]) for v in templates]
    output.append(section("引擎模板（docs/engine_text_templates.json，完整）", rows))
    rows = [(f"layer/{key}", LAYER_LABELS[key], en) for key, en in i18n.LAYERS_EN.items()]
    for key, pair in i18n.WATCH_EN.items():
        rows += [(f"watch/{key}/title", WATCH_TEXT[key][0], pair[0]),
                 (f"watch/{key}/summary", WATCH_TEXT[key][1], pair[1])]
    for kind, table in [("legal", i18n.LEGAL), ("draft", i18n.STATUS)]:
        rows += [(f"{kind}/{key}", *pair) for key, pair in table.items()]
    rows += [("risk/" + key, key, en) for key, en in i18n.RISK.items()]
    output.append(section("层名、观察项、法律状态与风险", rows))
    rows = [(f"text/{i}", zh, en) for i, (zh, en) in enumerate(TEXT.items(), 1)]
    rows += [(f"error/{i}", zh, en) for i, (zh, en) in enumerate(ERROR_TEMPLATES, 1)]
    rows += [("resource/" + zh, zh, en) for zh, en in RESOURCES_EN.items()]
    rows += [("HTTP", "HTTP {code}：{body}", "HTTP {code}: {body}")]
    output.append(section("后端错误与校验（localization.py，完整）", rows))
    rows = [(f"audit/{i}", zh, en) for i, (zh, en) in enumerate(AUDIT_TEMPLATES, 1)]
    rows += [("audit parameter", zh, en) for zh, en in [
        ("内置夹具", "Built-in fixtures"), ("不影响现有订单", "No effect on current orders"),
        ("更新观察项", "Watch item updated"), ("、", ", ")]]
    output.append(section("审计模板及参数替换（localization.py，完整）", rows))
    pairs = [
        ("下一节点：{date}", "Next milestone: {date}"), ("无", "None"),
        ("税率 {rate}%\n第99章税号 {heading}\n适用入境日 {from} 至 {to}\n来源：{sources}",
         "Rate {rate}%\nChapter 99 heading {heading}\nEntry dates {from} to {to}\nSources: {sources}"),
        ("无截止", "No end date"),
        ("法律状态：{legal}\n原文标题：{title}\n发布日期：{date}\n摘要：{summary}\n草稿状态：{status}\n原文：{url}",
         "Legal status: {legal}\nOriginal title: {title}\nPublication date: {date}\nSummary: {summary}\nDraft status: {status}\nSource: {url}"),
        ("美国关税政策日报 · {date}", "U.S. Tariff Policy Brief · {date}"),
        ("贸易术语", "Incoterm"), ("渠道", "Channel"), ("税号", "HTS"), ("数量", "Quantity"),
        ("单价", "Unit price"), ("完税价格", "Customs value"), ("装船日", "Load date"),
        ("预计入境日", "Entry date"), ("状态", "Status"), ("电商", "E-commerce"),
        ("已报价", "Quoted"), ("已确认", "Confirmed"), ("已发货", "Shipped"), ("已入境", "Entered"),
        ("订单 {id} · {product}", "Order {id} · {product}"),
        ("影响单 {id} · {risk}", "Impact sheet {id} · {risk}"),
        ("订单 {id} {product}（HTS {hts}，{incoterm}）：风险 {risk}；新税率 {rate}%（基准 {baseline}%）；关税增量 {duty}；利润 {old} → {new}（变化 {delta}）\n原因：{reason}",
         "Order {id} {product} (HTS {hts}, {incoterm}): risk {risk}; new rate {rate}% (baseline {baseline}%); duty change {duty}; profit {old} → {new} (change {delta})\nReason: {reason}"),
        ("今天有新的已生效税率变化。", "There is a new rate change in force today."),
        ("今天没有新的已生效税率变化。", "There is no new rate change in force today."),
        ("待处理红色订单 {N} 单，合计利润变化 {M}。", "Red orders pending: {N}, total profit change {M}."),
        ("没有待处理的红色订单。", "No red orders are pending."),
        ("未配置模型，且没有该问题的内置答案。请先到「模型接入」页配置模型。",
         "No model is configured and this question has no built-in answer. Configure a model on Model Access first."),
    ]
    output.append(section("知识库、日报与对话动态模板（参数归一化）",
                          [(f"generated/{i}", zh, en) for i, (zh, en) in enumerate(pairs, 1)]))
    rows = []
    for filename, english, chinese in [("triage", "one_line_en", "one_line_zh"),
                                       ("extract", "summary_en", "summary_zh"),
                                       ("import", "notes_en", "notes_zh")]:
        data = json.loads((ROOT / f"backend/fixtures/llm/{filename}.json").read_text("utf-8"))
        for key, value in data.items():
            if english in value:
                rows.append((f"{filename}/{key}/{english}", value.get(chinese, ""), value[english]))
    data = json.loads((ROOT / "backend/fixtures/llm/chat.json").read_text("utf-8"))
    for key, value in data.items():
        if value.get("lang") == "en":
            zh = next((v["answer"] for v in data.values()
                       if v.get("lang") == "zh" and v.get("citations") == value["citations"]), "")
            rows.append((f"chat/{key}", zh, value["answer"]))
    output.append(section("分诊、抽取、导入和问答的英文夹具（完整）", rows))
    target = ROOT / "docs/i18n-review.md"
    target.write_text("\n".join(output), encoding="utf-8")
    print(f"Wrote {target}; frontend entries: {len(messages)}")


if __name__ == "__main__":
    main()
