# API.md

**通用约定：**

- 所有路径以 `/api` 开头，请求和响应都是 JSON，只有导入接口用文件上传。
- 日期格式 `YYYY-MM-DD`；时间用 ISO 8601，带 `+08:00`。
- 金额单位为美元，保留两位小数。百分比字段是数值，例如 `40.9` 表示 40.9%。
- 下文的 `latest` 都指基准批次（SPEC §5）。
- 后端用同名 Pydantic 模型实现下面的结构；前端类型用 `npm run gen:api` 生成。

## 1. 错误

```ts
interface ApiError { error: { code: string; message: string; details?: unknown } }
```

| HTTP | code | message（前端原样显示） |
|---|---|---|
| 400 | `BAD_REQUEST` | 请求参数不合法（请求体或查询参数校验失败都返回 400，不使用 FastAPI 默认的 422） |
| 403 | `FORBIDDEN` | 请求来源不被允许 |
| 404 | `NOT_FOUND` | 未找到{资源}：{id}（资源可为：订单、批次、草稿、日报、流水线） |
| 409 | `CONFLICT` | 该草稿存在未通过的校验，不能确认 · 该草稿已处理，不能重复操作 · 已有流水线正在运行 |
| 422 | `VALIDATION_FAILED` | 文件未导入，请修正以下错误（`details` 为 `errors[]`） |
| 500 | `INTERNAL` | 服务器内部错误 |

**CSV 行级错误的 message**（行号 row 从文件第 1 行算起，表头为第 1 行；缺列错误的 row 为 1）：

| 情况 | message |
|---|---|
| 缺列 | 缺少列 {col} |
| 取值不在允许范围内 | 取值不合法：{value}，允许：{allowed} |
| 日期格式错误 | 日期格式应为 YYYY-MM-DD |
| 日期先后不对 | 日期顺序应为 quote_date ≤ load_date ≤ entry_date ≤ delivery_date |
| 数值不满足条件 | {field} 必须{条件}，条件为以下之一：大于 0 / 不小于 0 / 在 0 到 200 之间 / 在 0 到 100 之间（不含 100） |
| 非数字 | {field} 必须是数字 |
| 订单号重复 | 订单号重复：{order_id} |
| 税号不在规则库 | 规则库中没有该税号，目前支持：{list} |

## 2. 接口

| 方法 | 路径 | 请求 | 响应 | 说明 |
|---|---|---|---|---|
| GET | `/api/health` | — | `{status:"ok"}` | |
| GET | `/api/meta` | — | `Meta` | |
| GET | `/api/orders` | — | `Order[]` | |
| POST | `/api/orders/import` | multipart，字段 `file` | `ImportResult` | 有任一行出错时整个文件不导入（422）；成功后新建基准批次 |
| POST | `/api/runs` | — | `ImpactRun` | 「重新计算」：用今天新建基准批次 |
| GET | `/api/runs/latest` | — | `ImpactRun` | |
| GET | `/api/impacts` | 查询参数见 §3 | `ImpactCard[]` | |
| GET | `/api/impacts/{order_id}` | — | `ImpactDetail` | 取基准批次 |
| POST | `/api/impacts/{order_id}/decision` | `DecisionRequest` | `Decision` | |
| GET | `/api/decisions` | `limit`（缺省 20，最大 200）、`offset`（缺省 0） | `DecisionRow[]` | 全部提交记录，按时间倒序 |
| GET | `/api/audit` | `limit`（缺省 50，最大 200） | `AuditEvent[]` | 按 seq 倒序 |
| GET | `/api/briefs` | — | `{date: string; item_count: number}[]` | 有日报的日期，倒序 |
| GET | `/api/briefs/latest` | — | `Brief` | 没有日报时返回 404 |
| GET | `/api/briefs/{date}` | — | `Brief` | |
| POST | `/api/pipeline/runs` | — | `PipelineRun`（202） | 手动运行；已有流水线在运行时返回 409 |
| GET | `/api/pipeline/runs/latest` | — | `PipelineRun` | 没有记录时返回 404 |
| GET | `/api/pipeline/runs/{id}` | — | `PipelineRun` | |
| GET | `/api/rule-drafts` | `status`（可选；缺省返回全部） | `RuleDraft[]` | |
| GET | `/api/rule-drafts/{id}` | — | `RuleDraftDetail` | |
| POST | `/api/rule-drafts/{id}/review` | `{action:"approve"\|"reject"\|"needs_detail"; note?: string}` | `RuleDraft` | 只能对 `draft` 或 `needs_detail` 状态的草稿操作，其余状态返回 409；approve 的转换规则见 AI_PIPELINE §5 |
| GET | `/api/rules/snapshot` | — | 与 `rules.json` 同结构 | |
| GET | `/api/watch-items` | — | `WatchItem[]` | 排序：severity 红 > 橙 > 黄，其次 `next_milestone` 升序（空值排最后），最后按 id |
| GET | `/api/settings/llm` | — | `LlmSettings` | |
| PUT | `/api/settings/llm` | `{base_url: string; api_key?: string; model: string}` | `LlmSettings` | 不传 `api_key` 时保留原值；首次保存必须带 `api_key` |
| DELETE | `/api/settings/llm` | — | `LlmSettings` | 清除配置，之后智能体改用夹具 |
| POST | `/api/settings/llm/test` | — | `{ok: boolean; message: string; latency_ms: number \| null}` | 用已保存的配置发一次测试请求（AI_PIPELINE §2） |

## 3. `/api/impacts` 查询参数

| 参数 | 取值 | 缺省 |
|---|---|---|
| `risk` | 逗号分隔的 `红,橙,黄,绿` | 全部 |
| `incoterm_group` | `all` / `ddp` / `non_ddp` | `all` |
| `decision` | `pending` / `adopted` / `dismissed` / `needs_detail` | 全部 |
| `q` | 匹配订单号、品名、HTS 中的任一项；不区分大小写，包含即命中 | 空 |

**固定排序：**

1. 未入境的订单在前，按 `entry_date` 升序。
2. `status=entered` 的订单在后，按 `entry_date` 降序。
3. `entry_date` 相同时按 `order_id` 升序。

## 4. 数据结构

```ts
type RiskLevel = "红" | "橙" | "黄" | "绿";
type DecisionKind = "pending" | "adopted" | "dismissed" | "needs_detail";
type LegalStatus = "in_force" | "signed_pending" | "scheduled_expiry" | "proposed"
  | "investigation" | "negotiation_no_tariff" | "court_ruling" | "procedural";

interface Meta {
  product_name: "Mariner AI";
  hts_release: string;                 // 最近一次 USITC 检查得到的版本，如 "2026HTSRev22"；还没检查过时为 "—"
  as_of: string;                       // 今天
  llm_configured: boolean;
  counts: { pending: number; red: number; orange: number; yellow: number; green: number;
            urgent: number;            // 风险为红或橙、且状态为 pending
            drafts_pending: number;    // 状态为 draft 的草稿数
            decisions_total: number }; // 除 drafts_pending、decisions_total 外，都按基准批次统计
  today: { processed: number; total: number; adopted: number; dismissed: number; needs_detail: number };
  // processed：基准批次中，当前状态不是 pending、且最后一次决策的 business_date 为今天的订单数
  // adopted / dismissed / needs_detail：processed 按当前状态拆分
  // total = processed + counts.pending
  latest_run: { id: string; created_at: string } | null;
}

interface Order {   // 字段名与 seed/engine/orders_sample.csv 的表头一致
  order_id: string; product: string; hts10: string; origin: "CN";
  incoterm: "EXW"|"FCA"|"FOB"|"CFR"|"CIF"|"CPT"|"CIP"|"DAP"|"DPU"|"DDP";
  channel: "b2b" | "ecom"; importer_of_record: "seller" | "buyer";
  tariff_clause: string;                  // "none"，或 "share:x"（0 ≤ x ≤ 1）
  status: "quoted" | "confirmed" | "shipped" | "entered";
  qty: number; unit_price_usd: number; purchase_cost_cny_per_unit: number; other_cost_cny_per_unit: number;
  fx_cny_per_usd: number; intl_freight_usd: number; insurance_usd: number; us_side_cost_usd: number;
  customs_value_usd: number; transport_mode: "ocean" | "air" | "postal";
  quote_date: string; load_date: string; entry_date: string; delivery_date: string;
  baseline_duty_rate_pct: number; target_margin_pct: number;
}
// 导入校验：
// - UTF-8 编码，可带 BOM；表头必须包含上面全部字段，顺序不限。
// - 枚举字段的取值见上方类型定义。
// - 日期满足 quote_date ≤ load_date ≤ entry_date ≤ delivery_date。
// - qty、unit_price_usd、purchase_cost_cny_per_unit、fx_cny_per_usd、customs_value_usd 必须大于 0。
// - 其余金额和成本字段不小于 0。
// - baseline_duty_rate_pct 在 0 到 200 之间；target_margin_pct 在 0 到 100 之间（不含 100）。
// - 同一文件内 order_id 不能重复；hts10 必须在规则库中。
// - importer_of_record 只用于展示，不做校验。

interface ImportResult { imported: number; updated: number; run_id: string | null;
  errors: { row: number; field: string; message: string }[] }

interface ImpactRun { id: string; as_of: string; created_at: string; order_count: number;
  total_profit_delta_usd: number; total_potential_refund_usd: number }

interface ChainNode { key: "rules" | "calc" | "human"; state: "done" | "warn" | "pending" | "needs_detail" | "todo" }

interface ImpactCard {
  run_id: string; order_id: string; product: string; hts10: string; incoterm: string;
  channel: "b2b" | "ecom"; importer_of_record: "seller" | "buyer"; status: Order["status"]; entry_date: string;
  risk_level: RiskLevel; tag: "利好" | ""; profit_delta_usd: number;
  countdown: { kind: "entry" | "rule_boundary" | "entered"; days: number | null };
  chain: ChainNode[];        // 固定 3 个，顺序为 rules, calc, human
  decision: DecisionKind;
}

interface DutyLayer { id: string; label: string; heading: string; rate_pct: number; duty_usd: number;
  refund_status: "struck_down" | "challenged_pending_appeal" | null }

interface Check { key: "rules_confirmed" | "evidence" | "hts_exists" | "baseline_match" | "unverified_fields";
  status: "pass" | "warn" | "fail"; value: string | null }

interface ImpactDetail extends ImpactCard {
  // 引擎原有字段，名称与 seed/golden/impacts.json 一致
  rate_baseline_user_pct: number; rate_baseline_rules_pct: number; rate_new_pct: number;
  duty_baseline_usd: number; duty_new_usd: number; duty_delta_usd: number; mpf_usd: number; hmf_usd: number;
  seller_profit_baseline_usd: number; seller_profit_new_usd: number;
  margin_baseline_pct: number; margin_new_pct: number;
  buyer_landed_cost_change_pct: number | null; potential_refund_usd: number;
  risk_reasons: string; flags: string[]; actions: string[];
  // 移植时新增的字段（SPEC §8）
  layers: DutyLayer[]; revenue_usd: number; seller_cost_baseline_usd: number; seller_cost_new_usd: number;
  timing_boundary_date: string | null; timing_saving_usd: number | null; watch_ids: string[];
  // 适配层生成
  checks: Check[];
  agent_chain: { agent: "collector" | "triage" | "extract" | "impact" | "human";
                 status: "done" | "skipped" | "failed" | "pending" | "not_run"; at: string | null }[];
  sources: { rule_id: string; title: string; url: string }[];
  order: Pick<Order, "load_date" | "quote_date" | "customs_value_usd" | "transport_mode" | "tariff_clause">;
}

interface DecisionRequest { decision: "adopted" | "dismissed" | "needs_detail"; note?: string /* 最多 500 字 */ }
interface Decision { order_id: string; run_id: string; decision: DecisionKind; note: string | null;
  decided_at: string; actor: "本地用户"; audit_hash: string }
interface DecisionRow extends Decision { product: string; profit_delta_usd: number }

// hash = sha256_hex(prev_hash + canonical_json(除 hash 外的全部字段))
// canonical_json：键排序、无空白（separators=(',', ':')）、ensure_ascii=False、UTF-8
// 第一条记录的 prev_hash 为 64 个 "0"
interface AuditEvent { seq: number; at: string; business_date: string; actor: string; action: AuditAction;
  entity: string; summary: string; prev_hash: string; hash: string }
type AuditAction = "ORDERS_IMPORTED" | "RUN_CREATED" | "COLLECTED" | "TRIAGED" | "EXTRACTED" | "VALIDATED"
  | "RULE_APPROVED" | "RULE_REJECTED" | "RULE_NEEDS_DETAIL" | "BRIEF_PUBLISHED" | "DECIDED" | "LLM_SETTINGS_CHANGED";

interface Brief {
  date: string; generated_at: string; conclusion: string;
  items: { kind: "policy" | "expiry" | "watch" | "preview_alert";
           title: string;                  // policy / preview_alert：分诊的 one_line_zh；expiry / watch：WatchItem.title
           original_title: string | null;  // policy / preview_alert：联邦公报原文标题；其余为 null
           legal_status: LegalStatus | null;
           summary: string;                // 有抽取结果时用 summary_zh，否则用 one_line_zh；expiry / watch 用 WatchItem.summary
           affected_order_ids: string[];   // expiry / watch 取自 WatchItem；其余为 []
           impact_usd: number | null;      // expiry / watch 取自 WatchItem；对应草稿为 draft 时取 impact_preview.profit_delta_usd；其余为 null
           source_url: string | null; published_at: string | null;
           confirmed: boolean;             // 该文件没有草稿，或草稿已确认 → true；否则 false
           draft_status: "draft" | "needs_detail" | "approved" | "rejected" | null }[];
  order_summary: { total: number; red: number; orange: number; yellow: number; green: number;
                   profit_delta_usd: number; refund_usd: number };   // 基准批次
}

type AgentKey = "collector_fr" | "collector_pi" | "collector_usitc" | "triage" | "extract" | "validate" | "brief";
interface PipelineRun { id: string; trigger: "schedule_0730" | "manual";
  status: "running" | "succeeded" | "partial" | "failed"; started_at: string; finished_at: string | null;
  steps: { agent: AgentKey; status: "pending" | "running" | "succeeded" | "failed" | "skipped_no_fixture";
           started_at: string | null; finished_at: string | null;
           counts: { input: number; output: number; skipped: number; errors: number }; message: string | null }[] }

interface RuleChange { change_type: "program_add" | "program_update" | "hts_profile_update" | "watch_item_upsert" | "no_rate_change";
  target_id: string | null; payload: Record<string, unknown> }
interface RuleDraft {
  id: string; source_document_number: string; source_url: string;
  title: string;                   // 分诊的 one_line_zh
  original_title: string;
  legal_status: LegalStatus; change: RuleChange; summary_zh: string;
  evidence: { field: string; quote: string; verified: boolean }[];
  validation: { check: "V1"|"V2"|"V3"|"V4"|"V5"|"V6"|"V7"|"V8"|"V9"; status: "pass" | "warn" | "fail" | "n/a"; message: string }[];
  status: "draft" | "approved" | "rejected" | "needs_detail";
  impact_preview: { orders_affected: number; profit_delta_usd: number } | null;
  created_at: string;
}
interface RuleDraftDetail extends RuleDraft {
  source_text: string;    // V1 使用的原文（AI_PIPELINE §7，已做空白归一化）
  highlights: { start: number; end: number; field: string }[] }   // 每条 quote 在 source_text 中首次出现的位置

interface WatchItem { id: string; title: string; summary: string; legal_status: LegalStatus; certainty: number;
  next_milestone: string | null; sources: string[];
  affected_order_ids: string[];    // 基准批次中，watch_ids 包含该观察项的订单
  impact_usd: number | null;       // legal_status 为 scheduled_expiry / in_force / signed_pending 时，等于受影响订单 profit_delta_usd 之和；否则为 null
  severity: RiskLevel }            // 受影响订单中最高的风险等级；没有受影响订单时为 "黄"

interface LlmSettings { configured: boolean; base_url: string | null; model: string | null;
  api_key_masked: string | null;   // 形如 "****abcd"
  last_test: { ok: boolean; message: string; at: string; latency_ms: number | null } | null }
```

## 5. 状态判定

PipelineRun 和各步骤的状态判定规则见 AI_PIPELINE §6。

## 6. 派生字段（适配层，确定性计算）

**countdown（相对今天）：**

- `status=entered` → `entered`，`days` 为 null。
- 有 `timing_boundary_date` → `rule_boundary`，`days` = 边界日 − 今天。
- 其他情况 → `entry`，`days` = `entry_date` − 今天。

**chain：**

| 节点 | 规则 |
|---|---|
| `rules` | `checks` 中 `rules_confirmed` 和 `unverified_fields` 都是 pass → `done`；否则 `warn` |
| `calc` | 始终为 `done` |
| `human` | 由 decision 决定：pending → `pending`；adopted / dismissed → `done`；needs_detail → `needs_detail` |

**所用规则：** 指 `layers` 中 id 与快照里某个 program 的 id 相同的层。`MFN` 和 `SEC301_LIST_CN` 不算在内。

**checks：**

| key | 规则 |
|---|---|
| `rules_confirmed` | 若存在状态为 draft 或 needs_detail 的草稿，且其 `target_id` 等于所用规则的 id 或本单税号（只比较数字）→ `warn`，value 写文件号；否则 `pass` |
| `evidence` | 所用规则都有非空 `sources` → `pass`，否则 `fail`；没有所用规则时为 `pass` |
| `hts_exists` | 税号在快照的 `hts_profiles` 中 → `pass` |
| `baseline_match` | `abs(rate_baseline_user_pct − rate_baseline_rules_pct) < 1` → `pass`；否则 `warn`，value 格式为 `30.3% / 40.3%` |
| `unverified_fields` | 统计 flags 中以「规则库字段」开头的条数；为 0 → `pass`，否则 `warn`，value 写条数 |

**sources：**

- 所用规则中，每个 program 的每个 URL 生成一条，title 用 `program.name`。
- 本单命中的观察项也照此生成，title 用下表的中文标题。

**agent_chain（固定 5 个节点）：**

| 节点 | status | at |
|---|---|---|
| collector | 取最近一次流水线中三个采集步骤的最差状态，优先级 failed > skipped_no_fixture > succeeded；映射为 failed / skipped / done；从未运行过流水线时为 `not_run` | 三个采集步骤中最晚的 `finished_at` |
| triage、extract | 对应步骤的状态：succeeded → done，failed → failed，skipped_no_fixture → skipped；从未运行时为 `not_run` | 该步骤的 `finished_at` |
| impact | `done` | 批次的 `created_at` |
| human | pending → `pending`，其余 → `done` | 最后一次决策的时间 |

**C10 显示规则：**

| 状态 | 显示 |
|---|---|
| done | `ok` 底块 |
| failed | `bad` 底块 |
| skipped | 白底块，透明度 0.6 |
| not_run | 2px 虚线框，透明度 0.6 |
| human 节点 pending | `warn` 底块，文字为「你（待决定）」 |

`unverified_fields` 为 warn 时，在处理链末尾追加一个虚线节点「报关行复核（含未核实字段时）」。

**C15 节点状态：**

| 节点 | 来源 |
|---|---|
| 触发 | 最近一次流水线的 trigger 和 started_at |
| 采集 | 同 agent_chain 的 collector |
| 分诊 / 抽取 / 校验 / 日报 | 对应步骤的状态 |
| 人工确认 | `drafts_pending`：大于 0 时用 `warn` 底，显示「{n} 待确认」；等于 0 时用 `ok` 底 |
| 计算 | 基准批次的 created_at |
| 完成 | 流水线整体状态 |

**DutyLayer.label：**

| id | label |
|---|---|
| `MFN` | 普通税率 |
| `SEC301_LIST_CN` | 301 清单 |
| `SEC301_FORCED_LABOR_CN` | 301 强迫劳动 |
| `SEC122_GLOBAL` | 122 临时附加 |
| `IEEPA_FENTANYL_CN` | IEEPA 芬太尼 |
| `IEEPA_RECIPROCAL_CN` | IEEPA 对等 |
| 其他 | 显示 program 的 `name` |

**种子观察项的中文 title 和 summary：**

| id | title | summary |
|---|---|---|
| `W_301_EXCLUSION_EXPIRY` | 178 项中国 301 排除 11-09 到期 | 排除覆盖美东时间 2026-11-09 23:59 前入境的货物；截至 2026-10-31 未见延期公告。 |
| `W_232_ROBOTICS` | 机器人与工业机械 232 公告 | 2026-10-28 签署，启动谈判；暂无税率、税号清单和生效日，首次进展报告约 2027-04-26。 |
| `W_301_EXCESS_CAPACITY` | 301 产能过剩调查（中国：钢、铝、电池、光伏、半导体、汽车） | 2026-03-11 立案，尚无最终措施。 |

由草稿新建的观察项：title 用分诊的 `one_line_zh`，summary 用抽取的 `summary_zh`。

**审计摘要（summary 字段）：**

| action | actor | summary |
|---|---|---|
| `ORDERS_IMPORTED` | 本地用户 | 导入 {a} 行，更新 {b} 行 |
| `RUN_CREATED` | 系统 | 批次 {run_id} · as_of {date} |
| `COLLECTED` | 采集器中文名 | 新增 {n} 篇 |
| `TRIAGED` | 分诊 | 分诊 {output} 篇，相关 {m} 篇，无夹具跳过 {skipped} 篇 |
| `EXTRACTED` | 抽取 | 生成草稿 {output} 篇，无夹具跳过 {skipped} 篇 |
| `VALIDATED` | 校验 | 校验草稿 {n} 篇，存在不通过项 {k} 篇 |
| `RULE_APPROVED` | 本地用户 | 确认 {document_number} · {结果}；结果取以下之一：新建规则版本 / 不影响现有订单（规则库无此税号）/ 无税率变化 / 更新观察项 |
| `RULE_REJECTED` | 本地用户 | 驳回 {document_number} |
| `RULE_NEEDS_DETAIL` | 本地用户 | {document_number} 需补充 |
| `BRIEF_PUBLISHED` | 日报 | 日报 {date} · {n} 条 |
| `DECIDED` | 本地用户 | {order_id} · {决策中文}；有备注时追加「 · 备注：{note}」 |
| `LLM_SETTINGS_CHANGED` | 本地用户 | 模型配置已保存：{model} / 模型配置已清除 |
