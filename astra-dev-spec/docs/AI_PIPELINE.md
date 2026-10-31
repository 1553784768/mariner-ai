# AI_PIPELINE.md

## 1. 智能体

| key | 名称 | 类型 | 输入 | 输出 |
|---|---|---|---|---|
| `collector_fr` | 联邦公报采集 | 确定性 | 联邦公报 documents API | `PolicyDocument` |
| `collector_pi` | 公开预览采集 | 确定性 | 联邦公报 public-inspection API | `PolicyDocument`（`is_public_inspection=true`） |
| `collector_usitc` | 税则版本检查 | 确定性 | USITC releaseList | `HtsRelease` |
| `triage` | 分诊 | 大模型 | 每篇新文件的元数据 | `TriageResult` |
| `extract` | 抽取 | 大模型 | 符合条件的文件全文 | `ExtractionResult` → `RuleDraft` |
| `validate` | 校验 | 确定性 | `RuleDraft` | `validation[]`、`impact_preview` |
| `brief` | 日报 | 确定性 | 当日文件、观察项、草稿、基准批次 | `Brief` |
| `impact` | 计算引擎 | 确定性 | 规则快照 + 订单 | 重算批次（不属于流水线，按 SPEC §6 的时机触发） |

`AgentStep` 的记录粒度：triage 和 extract 每处理一篇文件写一条，其余步骤每次运行写一条（`document_number` 为空）。`PipelineRun.steps` 是按 agent 汇总后的结果。记录包含以下字段：

- 标识与归属：`id`、`pipeline_run_id`、`business_date`、`agent`、`document_number`
- 运行情况：`started_at`、`finished_at`、`status`、`model`（使用夹具时写 `fixture`）、`prompt_version`
- 内容：`input_sha256`、`output_json`、`error`
- 计量：`tokens_in`、`tokens_out`、`latency_ms`

## 2. 模型调用（`agents/llm_client.py`）

```python
class LLMClient(Protocol):
    def complete_json(self, *, system: str, user: str, schema: type[BaseModel], fixture_key: str, role: Literal["triage","extract"]) -> BaseModel: ...
```

### 2.1 选择客户端

`llm_settings` 表里有配置时用 `HttpLLMClient`，没有时用 `FixtureLLMClient`。

### 2.2 FixtureLLMClient

- 按 `role` 从 `backend/fixtures/llm/{triage,extract}.json` 中读取 `fixture_key`（即 document_number）对应的输出。
- 读不到时抛出 `NoFixture`，调用方把这篇文件计入 skipped。

### 2.3 HttpLLMClient（OpenAI Chat Completions 兼容格式）

**请求：**

- `POST {base_url 去掉末尾 /}/chat/completions`
- 请求头：`Authorization: Bearer {api_key}`、`Content-Type: application/json`
- 请求体：

  ```json
  {"model": "<model>",
   "messages": [{"role":"system","content":"<system>\n\nJSON schema:\n<schema>"},
                {"role":"user","content":"<user>"}],
   "response_format": {"type": "json_object"}}
  ```

  不发送 `temperature`、`top_p` 等其他参数。

**处理响应：**

1. 取 `choices[0].message.content`，用 `json.loads` 解析，再用 Pydantic 校验。
2. 解析或校验失败时，在 user 消息末尾追加「上次输出不符合要求：{错误}。只返回符合要求的 JSON。」，再试 1 次；仍然失败就计入 errors。
3. 网络错误或 5xx：等 2 秒后重试 1 次。4xx：不重试，计入 errors，message 写状态码和响应正文的前 200 个字符。
4. 超时时间 120 秒。

### 2.4 测试连接（`POST /api/settings/llm/test`）

用同一个接口发送：

- system：`Reply with the JSON object {"ok": true}.`
- user：`ping`

`content` 解析后为 `{"ok": true}` 即判定成功，message 为「连接成功」；否则 message 写错误原因。结果写回 `llm_settings.last_test`。

## 3. 采集器

**通用规则：**

- 访问主机白名单、User-Agent、请求间隔、超时和重试：见 SPEC §10。
- 按 `document_number` 去重。
- `COLLECTOR_MODE=fixture` 时只读下表中的夹具文件，不发任何网络请求。

**监控的机构 slug：** `trade-representative-office-of-united-states`、`u-s-customs-and-border-protection`、`international-trade-administration`、`industry-and-security-bureau`、`executive-office-of-the-president`。

| 采集器 | live 模式请求 | fixture 文件 |
|---|---|---|
| `collector_fr` | `GET https://www.federalregister.gov/api/v1/documents.json`，参数见下方 | `federal_register/documents_ustr_cbp_2026-10-01_2026-10-29.json` |
| `collector_pi` | `GET https://www.federalregister.gov/api/v1/public-inspection-documents/current.json`，只保留 `agencies[].slug` 在监控列表中的文件 | `federal_register/public_inspection_current_2026-10-31.json` |
| `collector_usitc` | `GET https://hts.usitc.gov/reststop/releaseList`，取 `status=="current"` 的那条 | `usitc/releaseList_2026-10-31.json` |
| 全文 | 正式文件读 `raw_text_url`（返回带 `<pre>` 的 HTML，需去标签并反转义）；公开预览文件读 `pdf_url`（用 pdfplumber 提取文本） | `federal_register/document_<号>_raw_text.html` |
| 税号查询（V5、V6 用） | `GET https://hts.usitc.gov/reststop/search?keyword=<code>` | `usitc/search_<code>.json`；没有对应文件时，该项结果记为 warn，说明「无夹具，未核验」 |

`collector_fr` 的请求参数：

- 每个监控 slug 各加一个 `conditions[agencies][]`
- `conditions[publication_date][gte]`：上次成功运行的日期；首次运行用今天减 30 天
- `order=newest`，`per_page=100`
- `fields[]` = `title, document_number, publication_date, type, agency_names, html_url, effective_on, abstract, action, dates, raw_text_url, pdf_url`
- 有 `next_page_url` 时继续翻页

**公开预览不可用：** 响应中 `count == 0`，或带有 `meta.pil_unavailability_message` 时，按「无新文件」处理。样例见 `federal_register/public_inspection_unavailable_example.json`。

**fixture 模式的元数据合并：** 如果存在 `document_<号>_fields.json`，把其中的 `abstract`、`action`、`dates`、`raw_text_url` 合并进该文件的元数据。

## 4. 数据结构

```python
LegalStatus = Literal["in_force","signed_pending","scheduled_expiry","proposed",
                      "investigation","negotiation_no_tariff","court_ruling","procedural"]

class Evidence(BaseModel):
    field: str          # 相对 ExtractionResult 的点路径，如 change.target_id、change.payload.s301_exclusion.valid_from、legal_status
    quote: str          # 原文逐字摘录，≤ 300 字符

class TriageResult(BaseModel):
    document_number: str
    relevant: bool
    category: Literal["rate_change","exclusion","scope_change","procedure","fee","refund",
                      "investigation","negotiation","comment_request","adcvd","needs_fulltext","irrelevant"]
    programs: list[Literal["SEC301","SEC232","SEC122","IEEPA","ADCVD","DE_MINIMIS","FEES","OTHER"]]
    countries: list[str]               # ISO-2 代码，或 "ALL"
    legal_status: LegalStatus | None
    needs_fulltext: bool
    one_line_zh: str                   # ≤ 60 字
    evidence: list[Evidence]           # 至少 1 条
    confidence: float

class RuleChange(BaseModel):
    change_type: Literal["program_add","program_update","hts_profile_update","watch_item_upsert","no_rate_change"]
    target_id: str | None
    payload: dict

class ExtractionResult(BaseModel):
    document_number: str
    legal_status: LegalStatus
    change: RuleChange
    summary_zh: str                    # ≤ 120 字
    evidence: list[Evidence]
```

**payload 结构：** 与 `rules.json` 中对应对象相同。

| change_type | payload 对应的对象 |
|---|---|
| `program_add` / `program_update` | `programs[]` 的元素 |
| `watch_item_upsert` | `watch_items` 的值；另外可带 `hts_targets: [税号…]` |
| `hts_profile_update` | `hts_profiles` 的值 |

`hts_profile_update` 中，排除范围的变化写在 `s301_exclusion` 字段里，结构为：

```
{heading: str|null, note: str, valid_from: date|null, valid_to: date|null, verified: false}
```

**进入抽取的条件：** `relevant=true`，且 `category` 属于 `rate_change`、`exclusion`、`scope_change`、`investigation`、`negotiation`、`needs_fulltext`、`comment_request`、`procedure`、`refund` 之一。`category=adcvd` 的文件只进日报，不抽取。

**全文缺失：**

- fixture 模式下没有全文文件时，用元数据（title、abstract、action、dates）作为 text 继续处理，不计入 errors。
- live 模式下下载全文失败，计入 errors。

**全文长度：** 超过 120,000 个字符时，只把前 120,000 个字符放进 user 消息，并标注 `"truncated": true`。V1 校验仍对照完整全文。

**税号比较：** 只比较数字部分（去掉点和空格）。

## 5. 确认草稿时的转换

| change_type | 动作 |
|---|---|
| `program_add` | 新建 v1。`published` 设为文件发布日，忽略 payload 中的值。payload 必须含 `id, name, heading, rate_pct, origins, valid_from, valid_to, applies_to_232_goods, status, refund_status, sources`（由 V8 检查） |
| `program_update` | 在最新版本上按合并规则生成新版本，`published` 保持原值 |
| `hts_profile_update` | 目标税号在 `hts_profiles` 中：合并后生成新版本。不在：不建版本，审计结果写「不影响现有订单（规则库无此税号）」 |
| `watch_item_upsert` | 新建或更新观察项，`certainty` 按下表取值。`hts_targets` 中、且在 `hts_profiles` 里的税号，各生成一个 profile 新版本，把该观察项 ID 追加到 `watch` 列表 |
| `no_rate_change` | 不建版本，只写审计 |

**合并规则：**

- 对象按键递归合并。
- 列表整体替换。
- 值为 `null` 的键表示把该字段设为 `null`。

新建了任何规则版本后，立即新建一个基准批次。

**certainty 取值：**

| 法律状态 | certainty |
|---|---|
| `in_force`、`court_ruling`、`procedural` | 1.0 |
| `signed_pending`、`scheduled_expiry` | 0.9 |
| `proposed` | 0.4 |
| `investigation` | 0.2 |
| `negotiation_no_tariff` | 0.1 |

## 6. 编排与状态（`pipeline/orchestrator.py`）

**运行顺序：** `collector_fr` → `collector_pi` → `collector_usitc` → `triage` → `extract` → `validate` → `brief`。

**重复处理与并发：**

- 已成功分诊或抽取的文件不再处理。
- 上次结果为 skipped 或出错的文件，下次运行时重试。
- 同一时间只允许运行一个流水线：手动触发时返回 409；定时任务直接跳过本次，只写应用日志。

**步骤状态：**

| 步骤类型 | 规则 |
|---|---|
| triage、extract（逐篇处理） | 每篇按结果计入 `output`、`skipped`（无夹具）或 `errors`。`errors > 0` → `failed`；`skipped == input > 0` → `skipped_no_fixture`；其余情况 → `succeeded`（没有输入也算 `succeeded`） |
| 确定性步骤 | 成功 → `succeeded`，抛异常 → `failed` |

**流水线状态：**

| 条件 | 状态 |
|---|---|
| 三个采集器全部 failed | `failed` |
| 任一步骤 failed 或 skipped_no_fixture，或任一步骤 `skipped > 0` | `partial` |
| 其余 | `succeeded` |

前端在批次处于 `running` 时每 2 秒轮询一次 `GET /api/pipeline/runs/{id}`。

**fixture 模式首次运行的期望结果（`AS_OF_DATE=2026-10-31`）：**

| 步骤 | status | input | output | skipped | errors |
|---|---|---|---|---|---|
| collector_fr | succeeded | 20 | 20 | 0 | 0 |
| collector_pi | succeeded | 108 | 10 | 0 | 0 |
| collector_usitc | succeeded | 1 | 1 | 0 | 0 |
| triage | succeeded | 30 | 23 | 7 | 0 |
| extract | succeeded | 8 | 2 | 6 | 0 |
| validate | succeeded | 2 | 2 | 0 | 0 |
| brief | succeeded | 1 | 1 | 0 | 0 |

期望的流水线状态为 `partial`。各步骤 input / output 的含义：

| 步骤 | input | output |
|---|---|---|
| collector_fr | 接口返回的篇数 | 入库篇数 |
| collector_pi | 接口返回的篇数 | 按机构过滤后的入库篇数 |
| collector_usitc | releaseList 请求次数 | 记录的当前版本数 |
| validate | 本次新建的草稿数 | 完成校验的草稿数 |
| brief | 1 | 生成的日报份数 |

## 7. 校验（`validate`）

原文 = 标题 + abstract + action + dates + 全文（如有），连续空白合并为一个空格后再比对。

| 编号 | 检查 | 不满足时 |
|---|---|---|
| V1 | 每条 evidence.quote 都能在原文中找到（区分大小写） | fail |
| V2 | payload 中的 `rate_pct`、`valid_from`、`valid_to`、`heading`、`in_transit_exception`（含 `s301_exclusion` 内的同名字段）以及 `target_id`，只要值不为空，就至少有一条 evidence 的 field 指向它 | fail |
| V3 | 在途豁免的 `loaded_before` > `entered_before` → fail；否则 `valid_from` < 文件发布日 − 30 天 → warn；否则 pass | 见左 |
| V4 | `0 ≤ rate_pct ≤ 200` | fail |
| V5 | 第 99 章税号能在 USITC 查到 | warn |
| V6 | target_id 是税号时，能在 USITC 查到 | warn |
| V7 | 与已有规则的 id 相同、日期重叠，但税率不同 | warn |
| V8 | `program_add` 的字段齐全 | fail |
| V9 | `hts_profile_update` 的目标在 `hts_profiles` 中、且含 `s301_exclusion` 时，其 `valid_to` 不能为空 | fail |

**n/a 规则：** V1 始终适用。其余检查涉及的字段在该草稿中都不存在或都为空时，记为 `n/a`：

- V2：所列字段和 `target_id` 都为空。
- V3：没有 `valid_from`，也没有 `in_transit_exception`。
- V4：没有 `rate_pct`。
- V5：没有非空的 `heading`。
- V6：change_type 不是 `hts_profile_update`。
- V7：change_type 不是 `program_add` 或 `program_update`。
- V8：change_type 不是 `program_add`。
- V9：不满足该行的前提条件。

**V5、V6 的命中规则：** USITC search 结果中，任一条的 `htsno` 去掉点后与目标税号的数字完全相同，即为 pass；否则为 warn。

每条 evidence 在 V1 校验后写入 `verified`（是否找到）。

**impact_preview：**

1. 把草稿当作已确认，套用到基准批次的规则快照上重算一次。
2. 与基准批次逐单比较，统计利润变化有变动的订单数，以及变动值之和。

结果只写入草稿，不影响收件箱。

## 8. 日报（`brief`，确定性）

**条目，按以下顺序排列：**

1. **观察项：** `next_milestone` 在今天之后 30 天内（含第 30 天）的观察项。`scheduled_expiry` 的记为 `kind=expiry`，其余记为 `watch`。同类内部按 `/api/watch-items` 的顺序排。
2. **正式文件：** `relevant=true`、首次采集的 business_date 为今天、来自 `collector_fr` 的文件，记为 `kind=policy`，按 publication_date 倒序、再按 document_number 排。
3. **公开预览文件：** 条件同上但来自 `collector_pi`，记为 `kind=preview_alert`，排序同上。
4. 字段取值见 API.md 的 Brief 定义。`category=adcvd` 的条目，在 summary 末尾加「（反倾销/反补贴，不计算）」。

**结论：** 「今天{有/没有}新的已生效税率变化。待处理红色订单 {N} 单，合计利润变化 {M}。」

- 「有」的条件：今天新建过规则版本，且其 `change_type` 为 `program_add`、`program_update` 或 `hts_profile_update`。种子版本不算，`watch_item_upsert` 产生的版本也不算。不满足时为「没有」。
- N：基准批次中风险为红、且状态为 pending 的订单数。
- M：这些订单的 `profit_delta_usd` 之和，按 DESIGN §7 格式化。

每次流水线运行结束时生成当日日报，当天已有的日报会被覆盖。

## 9. 提示词（`agents/prompts/`，文件名带版本号；修改时新建 `_v2`，不覆盖旧版本）

**triage_v1.md（system）**

```
You classify U.S. Federal Register documents for a tool that recalculates U.S. import duties on goods of Chinese origin.
Use only the fields in the user message. Do not state facts that are not in those fields.
relevant = true if the document could create, change, confirm, schedule, suspend or end U.S. import duties, fees,
exclusions, refunds or entry procedures for imported goods, or antidumping/countervailing duties on products from China.
legal_status: pick from the enum using only the given text; if it cannot be determined, use null and set needs_fulltext = true.
countries: ISO-2 codes, or "ALL" when the measure applies to all origins.
one_line_zh: one Simplified Chinese sentence, at most 60 characters, containing only facts present in the fields.
evidence: at least one item; every quote must be copied verbatim from the fields.
Return only a JSON object that matches the schema.
```

user 消息：由 `document_number, title, type, agencies, abstract, action, dates, publication_date, effective_on` 组成的 JSON。

**extract_v1.md（system）**

```
You extract a single structured rule change from one U.S. legal document about import duties.
Use only the document text in the user message. Never use memory for HTS codes, rates or dates.
Every non-null field you output must be supported by an evidence item whose quote is copied verbatim from the text.
evidence.field is a dot path such as change.target_id or change.payload.s301_exclusion.valid_from.
If the text neither states an ad valorem rate nor changes the coverage of an exclusion, change_type must be
watch_item_upsert or no_rate_change. Exclusion coverage changes use hts_profile_update with payload.s301_exclusion.
If tariff codes are listed only in an annex that is not in the text, set payload.hts_scope = {"type":"annex_ref"} and leave codes empty.
summary_zh: Simplified Chinese, at most 120 characters.
Return only a JSON object that matches the schema.
```

user 消息：`{"document_number","title","publication_date","truncated","text"}` 组成的 JSON。
