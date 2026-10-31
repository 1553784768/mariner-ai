# V02_SPEC.md

本文件定义 v0.2 的全部改动。与 SPEC、API、AI_PIPELINE、DESIGN 冲突时，以本文件为准。版本号改为 `0.2.0`。

## 1. 范围

1. 修复验收问题：P1、P3、P4、P6–P10、P12–P14（§2）；P5 即 Q-001（§3）；P2 见 §8；P11（订单号 O 与 0 易混）本版不处理。
2. Q-001 按方案 A 处理（§3）。
3. 决策增强：采纳时指定具体建议；「需补充」必须填写说明（§4）。
4. 知识库：全站内容自动汇总，可手动编辑，只供问答参考（§5）。
5. 首页工作台：AI 对话，支持多模态导入订单（§6）。
6. 中英文切换：界面文案和生成内容都双语（§7）。
7. 真实环境冒烟测试脚本，对应 P2（§8）。

## 2. 验收问题修复

| 编号 | 要求 |
|---|---|
| P1 | 全局快捷键（Ctrl/⌘ + Enter / Backspace / D / K）在事件目标为 `input`、`textarea`、`select` 或 `[contenteditable]` 时一律不处理，其中 Ctrl/⌘+K 也不例外；面板自身声明的快捷键（§4.3）除外 |
| P3 | 加入 Prettier（`printWidth: 110`），新增 `npm run format`，并把格式检查加入 `npm run lint`；先对现有前端代码格式化一次，再开始其他任务 |
| P4 | `steps[].message`：步骤 failed 或 errors > 0 时，写入第一条错误的本地化原因。模型调用错误分为四类，模板见 §7.6：「无法连接」「超时」「HTTP {code}：{前 200 字符}」「返回内容不是符合要求的 JSON」。测试连接也用这四类模板 |
| P6 | 测试连接时，模型返回的内容能解析成 JSON、但不是 `{"ok": true}`，message 改为「模型已响应，但返回内容不是 {"ok": true}」；内容不能解析成 JSON 时，用 §7.6 的 JSON 模板 |
| P7 | 日报结论在 N = 0 时写「今天{有/没有}新的已生效税率变化。没有待处理的红色订单。」 |
| P8 | 日报条目的 summary 与 title 相同时，前端不显示 summary |
| P9 | E2E 的字体断言排除名称以 ` Fallback` 结尾的字体族 |
| P10 | 分层表第一列加 `white-space: nowrap`。文档头部：保留标题「订单影响单」；标题下一行为 mono「{order_id} · 规则快照 {as_of} · {run_id}」；右上为「进口商：…」 |
| P12 | 品牌 Logo 的 `next/image` 加 `priority`；品牌块版本号改为「v0.2」 |
| P13 | 「分诊」审计摘要中的「相关 N 篇」只统计本次运行 |
| P14 | 校验新增两条：V8 要求 `program_add` 的 id 在规则库中不存在；`watch_item_upsert` 的 `target_id` 为空时，V2 判为 fail |

## 3. Q-001

- 适配层为 ImpactDetail 新增两个字段：
  - `seller_cost_delta_usd = round(seller_cost_new_usd − seller_cost_baseline_usd, 2)`
  - `margin_delta_pp = round(margin_new_pct − margin_baseline_pct, 2)`
- 利润表的变化列直接显示这两个字段：金额带正负号；百分点格式为 `−6.2pp`。
- 删除 `BLOCKED(Q-001)` 注释，把 `docs/QUESTIONS.md` 中 Q-001 的状态改为 ANSWERED（A）。

## 4. 决策增强

### 4.1 接口

`DecisionRequest`：

```ts
{
  decision: "adopted" | "dismissed" | "needs_detail";
  note?: string;
  action_indices?: number[];
}
```

| decision | 规则（不满足返回 400） |
|---|---|
| `adopted` | `action_indices` 必填且不能为空；元素不能重复；每个元素都必须在 `0 … actions.length−1` 范围内；`note` 可选 |
| `needs_detail` | `note` 必填，去掉首尾空白后长度为 1–500 |
| `dismissed` | `note` 可选 |

`action_indices` 只能在 `adopted` 时提供，其他决策带上该字段返回 400。

`Decision` 和 `DecisionRow` 新增字段：

```ts
adopted_actions: { index: number; text: string }[]
```

`text` 存储决策当时的中文原文，展示时按 §7.4 本地化。非采纳决策时为 `[]`。

### 4.2 沿用规则（在 v0.1 规则之上追加）

当前状态为 `adopted` 时，新批次必须同时满足以下两条才沿用原状态，否则重置为待处理：

1. 利润变化和风险等级都没有变化（v0.1 已有规则）。
2. `adopted_actions` 中的每条 `text` 都仍出现在新批次该单的 `actions` 里。

### 4.3 界面

**C22 可执行建议**

- 每条建议前加复选框，点整条也能切换勾选，默认不勾选。
- 选中样式：3px `ink` 边框，`canvas` 底色，并显示 `IconSquareCheck`。

**「采纳建议」按钮**

- 按钮文字为「采纳建议（{n}）」，n 是已勾选条数；n = 0 时禁用。
- Ctrl/⌘+Enter：n ≥ 1 时提交；n = 0 时只滚动到建议列表，在列表上方显示 2 秒提示「先勾选要采纳的建议」，不提交。

**「需补充」面板**

- 点击「需补充」按钮或按 Ctrl/⌘+D，在操作栏的决策按钮下方展开面板，不直接提交。
- 面板内容：标签「补充说明（必填）」；textarea 4 行，`maxlength` 500，右下角显示「{n}/500」；按钮「提交」（`warn` 底）和「取消」。
- 面板快捷键：Ctrl/⌘+Enter 提交，Esc 取消。
- 内容为空时「提交」禁用。

**文档与历史**

- 文档的大印章下方显示本单当前的决策详情：「已采纳：第 01、03 条」或「补充说明：{note}」。
- 最近处理表新增「说明」列：采纳显示「第 01、03 条」；需补充显示 note（最多 40 字，超出部分用 title 属性显示全文）。

**审计摘要（DECIDED）**

- 采纳：「{order_id} · 已采纳 · 第 {01、03} 条」。
- 需补充：「{order_id} · 需补充 · 补充：{note}」。

## 5. 知识库

### 5.1 数据

新表 `kb_entries`：

| 字段 | 说明 |
|---|---|
| `id` | `{source_type}:{source_ref}`。source_ref：policy 为文件号，watch 为观察项 id，rule 为 program id，brief 为日期，order 和 impact 为订单号；手动条目为 `manual:{uuid4}` |
| `source_type` | `policy` / `watch` / `rule` / `brief` / `order` / `impact` / `manual` |
| `sensitive` | `order`、`impact` 为 true，其余为 false |
| `editable` | `order`、`impact` 为 false，其余为 true |
| `title_zh`、`title_en`、`body_zh`、`body_en` | 当前显示的内容 |
| `auto_title_zh`、`auto_title_en`、`auto_body_zh`、`auto_body_en` | 最近一次系统生成的内容；手动条目为空 |
| `edited_zh`、`edited_en` | 对应语言是否被手动改过 |
| `source_changed` | 手动改过之后，系统生成的内容又发生了变化 |
| `created_at`、`updated_at`、`business_date` | |

全文检索：建一张 FTS5 虚拟表 `kb_fts`，列为 `(id UNINDEXED, title_zh, body_zh, title_en, body_en)`，`tokenize='trigram'`。条目每次变更都同步更新这张表。

正文一律按纯文本存储和显示（`white-space: pre-wrap`），不渲染 Markdown 或 HTML。

### 5.2 同步 `sync_kb()`

**触发时机：** 启动完成后、流水线结束后、草稿审核后、新建基准批次后、订单导入后。

**每条自动条目的处理：**

1. 按 §5.3 生成内容，写入 `auto_*` 字段。
2. 对每种语言分别判断：
   - 未手动编辑过：把 `title_*` 和 `body_*` 更新为自动内容。
   - 手动编辑过，且新的自动内容与上次不同：不覆盖用户内容，把 `source_changed` 设为 true。
3. 来源已不存在的自动条目（例如规则快照中已删除的 program 或观察项）：删除。

### 5.3 自动条目的来源和内容

金额、百分比、日期一律按 DESIGN §7 的格式。法律状态、风险等级等用 §7 的本地化标签。下表中文与英文结构对应。

| 类型 | 来源 | title | body（按行） |
|---|---|---|---|
| `policy` | `relevant=true` 的文件 | 分诊的 `one_line_zh` / `one_line_en` | 法律状态：…<br>原文标题：…<br>发布日期：…<br>摘要：{抽取 summary，没有时用 one_line}<br>草稿状态：{无 / 待确认 / 需补充 / 已确认 / 已驳回}<br>原文：{url} |
| `watch` | 快照中的观察项 | 本地化标题 | {本地化 summary}<br>下一节点：{日期或「无」}<br>（不写受影响订单和影响金额：这两项来自订单数据，只出现在 impact 条目中） |
| `rule` | 快照中的 program | 有本地化层名时用层名，否则用 name | 税率 {rate}%<br>第99章税号 {heading}<br>适用入境日 {valid_from} 至 {valid_to，空时写「无截止」}<br>来源：{sources 用空格连接} |
| `brief` | 每份日报 | 美国关税政策日报 · {date} | 第一行为结论的第一句（「今天有/没有新的已生效税率变化。」，不含订单数量和金额），其后每条条目一行：「- {title}」 |
| `order` | 订单表 | 订单 {order_id} · {product} | 贸易术语、渠道、税号、数量、单价、完税价格、装船日、预计入境日、状态，每项一行。渠道：b2b →「B2B」，ecom →「电商」/「E-commerce」；状态：quoted 已报价 / Quoted，confirmed 已确认 / Confirmed，shipped 已发货 / Shipped，entered 已入境 / Entered |
| `impact` | 基准批次 | 影响单 {order_id} · {risk} | 第一行：订单 {order_id} {product}（HTS {hts10}，{incoterm}）：风险 {risk}；新税率 {rate_new}%（基准 {rate_baseline_user}%）；关税增量 {duty_delta}；利润 {profit_b} → {profit_n}（变化 {delta}）<br>原因：{本地化 risk_reasons}<br>其后每条建议一行：「{nn}. {本地化 action}」 |

### 5.4 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/kb?type=&q=&lang=&include_sensitive=&limit=&offset=` | 返回 `KbEntrySummary[]`：`{id, source_type, title, snippet, sensitive, editable, edited, source_changed, updated_at}`。标题和摘要取 `lang` 对应语言；snippet 为正文前 120 个字符。缺省值：`include_sensitive=false`、`limit=50`（最大 200）、`offset=0` |
| GET | `/api/kb/{id}` | 返回 `KbEntry`，即 §5.1 的全部字段 |
| PUT | `/api/kb/{id}` | 请求体 `{lang, title, body}`，返回 `KbEntry`；条目 `editable=false` 时返回 409「系统生成的条目不能编辑」；成功后把 `edited_{lang}` 设为 true，`source_changed` 设为 false |
| POST | `/api/kb/{id}/restore` | 请求体 `{lang}`，返回 `KbEntry`；用 `auto_*` 覆盖当前内容，`edited_{lang}` 设为 false；两种语言都未编辑时，`source_changed` 设为 false |
| POST | `/api/kb` | 新建手动条目，请求体 `{title_zh?, body_zh?, title_en?, body_en?}`，至少要有一种语言同时带标题和正文；返回 `KbEntry` |
| DELETE | `/api/kb/{id}` | 只能删除手动条目，返回 `{deleted: true}`；其他类型返回 409「系统生成的条目不能删除」 |

**检索规则（`q`）：**

- 按空白拆成若干词，各词之间是 AND 关系。
- 长度 ≥ 3 的词：用 FTS5 短语查询，同时匹配中英文四列。
- 长度 < 3 的词：对四列做 LIKE 匹配。
- 至少有一个词走 FTS 时，按 `bm25` 升序排序；否则按 `updated_at` 倒序。

**审计：** 新增 `KB_EDITED`、`KB_RESTORED`、`KB_CREATED`、`KB_DELETED`，摘要为「{id} · {动作}」。

### 5.5 页面 `/knowledge`

- 导航位置：「知识库」，图标 `IconBook`，排在「政策日报」之后。
- **左栏（w-[40%]）：**
  - 搜索框。
  - 类型筛选：全部 / 政策 / 观察项 / 规则 / 日报 / 订单 / 影响单 / 手动。
  - 开关「显示订单数据」，默认关。
  - 「+ 新建条目」按钮。
  - 条目列表：用 C05 的简化卡片，只显示标题、类型标签，以及「已编辑」「来源已更新」「只读」标签。
- **右栏：** `brut-lg` 白底文档，内容依次为：
  - 标题
  - 类型标签和更新时间
  - 正文
  - 按钮「编辑」：编辑当前语言的标题和正文，界面用 C26 输入框和 12 行 textarea；编辑状态下按钮为「保存」「取消」
  - 按钮「恢复系统版本」：仅在当前语言被编辑过时显示
  - `source_changed` 为 true 时，顶部显示 `warn-soft` 横幅「来源已更新，当前显示的是你编辑过的版本」，并提供「查看系统版本」（展开显示 `auto_*`）和「恢复」两个按钮
  - 只读条目显示标签「系统生成，只读」，不显示「编辑」按钮
  - 手动条目在标题右侧显示 `brut-sm` 白底红字按钮「删除」；点击后用浏览器 confirm 弹出「确定删除这条知识吗？」，确认后才删除
- 「+ 新建条目」：右栏显示空白编辑器，只有当前界面语言的标题和正文两个输入框；保存时调用 POST `/api/kb`，只带当前语言的字段

## 6. 工作台：AI 对话与多模态导入

### 6.1 页面 `/`

- `/` 不再重定向到收件箱，改为「工作台」页。导航第一项为「工作台」，图标 `IconMessageChatbot`。
- 顶栏只有 h1「工作台」和时间行。
- 内容区分两栏：
  - **左栏（flex-1）：** C27 对话面板，`brut-lg` 白底，高度占满可视区。
  - **右栏（360px），从上到下：**
    1. 统计卡（C21 样式）：待处理、红色、紧急
    2. 最新日报卡：结论文字 + 链接「查看日报 →」
    3. 临界事件精简列表：前 3 条，每条显示标签和标题

### 6.2 对话面板 C27

- **消息区：**
  - 用户消息靠右，`canvas` 底，`brut-sm`。
  - 助手消息靠左，白底，`brut-sm`。
  - 助手消息下方显示引用标签（mono 10px，点击跳转到 `/knowledge?id=`）。
  - 数字守卫未通过时，消息上方显示 `bad` 底白字横幅「回答中有知识库里找不到的数字：{list}，请以订单影响单为准」。
- **开关「对话可使用订单数据」：** 位于输入框上方，默认关闭。开启时下方显示 `warn-soft` 提示「开启后，检索到的订单和影响单内容会发送给模型 {model}」。开关状态只在当前页面会话中保持。
- **输入区：**
  - 多行 textarea：Enter 发送，Shift+Enter 换行；输入法组字中（`isComposing` 为 true）按 Enter 不发送。
  - 附件按钮（`IconPaperclip`）：接受 `.csv .xlsx .pdf .png .jpg .jpeg`，单个文件 ≤ 10 MB。
  - 「发送」按钮；面板右上角有「新对话」按钮。
- **未配置模型时：** 顶部显示 `warn-soft` 横幅「未配置模型：只能回答内置示例问题。」，以及链接「去配置 →」。

### 6.3 对话接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/chat/conversations` | 新建对话，返回 `{id}` |
| GET | `/api/chat/conversations/latest` | 返回 `{id, created_at, messages: ChatMessage[]}`；没有对话时返回 404 |
| POST | `/api/chat/conversations/{id}/messages` | 请求体 `{text, lang, use_order_data}`，返回 `{user: ChatMessage, assistant: ChatMessage}` |

```ts
ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations: { id: string; title: string }[];
  guard: { ok: boolean; unknown_numbers: string[] } | null;
  import_job_id: string | null;
  created_at: string;
}
```

对话和消息存在 SQLite 的 `chat_conversations` 和 `chat_messages` 表中。

### 6.4 检索与回答

**1. 检索**

- 用问题文本按 §5.4 的规则检索知识库。`use_order_data=false` 时排除 `sensitive` 条目。
- 问题中出现现有订单号（与 `orders.order_id` 精确匹配，不区分大小写）且 `use_order_data=true` 时，直接加入 `impact:{id}` 和 `order:{id}`。
- 最多取 8 条。上下文为各条目的 `[{id}] {title}\n{body}`（用 `lang` 对应语言），总长不超过 24,000 字符。

**2. 调用模型**

- role 为 `chat`，提示词 `chat_v1.md` 见 §6.6。
- user 消息为 JSON：`{question, lang, context: [{id, title, body}]}`。
- 输出 schema：`{answer: string, citations: string[]}`。
- citations 只保留出现在上下文中的 id。

**3. 数字守卫**

1. 取出答案中所有匹配 `\d+(?:[.,:\-]\d+)*` 的片段。
2. 每个片段都必须以子串形式出现在「问题 + 全部上下文」中。
3. 有不满足的片段时，在 user 消息末尾追加「回答中出现了上下文里没有的数字：{list}。只能使用上下文中的数字。」，重试 1 次。
4. 仍不满足时照常返回答案，但 `guard.ok=false`，并在 `unknown_numbers` 中列出这些片段。

**4. 夹具模式（未配置模型）**

- 按「问题去掉首尾空白并转小写」查找 `fixtures/llm/chat.json`。
- 不做检索。上下文只取夹具 citations 中引用的条目；`use_order_data=false` 时去掉其中的 sensitive 条目，citations 也同步去掉这些条目。
- 没有对应夹具时，助手回复「未配置模型，且没有该问题的内置答案。请先到「模型接入」页配置模型。」

**5. 审计：** 上下文中包含 sensitive 条目时，写 `CHAT_ORDER_DATA_SENT`，摘要为「对话向模型 {model} 发送订单数据：{ids}」。夹具模式同样要写，`{model}` 记为「内置夹具」。

**6. 能力边界：** 对话只回答问题和导入订单，不执行采纳、确认规则、运行流水线等操作。用户提出这类请求时，回复中说明应到哪个页面操作。

### 6.5 多模态导入

**导入任务**

`POST /api/import-jobs`（multipart，字段 `file` 和 `conversation_id`）创建导入任务，并在该对话中写入两条消息：

- 用户消息「上传文件：{filename}」
- 助手消息：`import_job_id` 指向该任务；text 为「正在识别…」或「需要确认后发送给模型」

返回 `{job: ImportJob, messages: ChatMessage[]}`。文件大于 10 MB 时返回 413（`FILE_TOO_LARGE`，「文件过大（上限 10 MB）」）；不支持的类型返回 415（`UNSUPPORTED_FILE`，「不支持的文件类型」）。`GET /api/import-jobs/{id}` 返回 ImportJob，页面刷新后用它恢复预览。数据结构：

```ts
ImportJob {
  id: string;
  filename: string;
  kind: "csv" | "xlsx" | "pdf" | "image";
  status: "needs_consent" | "parsed" | "failed" | "imported" | "cancelled";
  requires_model: boolean;
  rows: Record<string, string>[];   // 字段名同 Order，值一律为字符串，按 CSV 导入的规则解析和校验
  errors: { row: number; field: string; message: string }[];   // csv 用文件行号（表头为第 1 行）；其他类型 row = 序号 + 1
  model: string | null;
  notes_zh: string | null;
  notes_en: string | null;
}
```

**存储：** 表 `import_jobs`。原文件字节存在 BLOB 字段中；任务变为 imported 或 cancelled 时清空字节，只保留元数据。启动时删除 7 天前创建的任务。

```
```

**按文件类型解析**

| 类型 | 本地解析条件 | 不满足条件时 |
|---|---|---|
| csv | 始终在本地解析，复用 CSV 导入的校验 | — |
| xlsx | 用 openpyxl 读第一个工作表；表头包含全部 Order 字段时在本地解析 | `requires_model=true`，状态为 `needs_consent` |
| pdf | 用 pdfplumber 提取表格；找到包含全部 Order 字段的表格时在本地解析 | `requires_model=true`，状态为 `needs_consent` |
| png / jpg / jpeg | — | `requires_model=true`，状态为 `needs_consent` |

**发送给模型**

`POST /api/import-jobs/{id}/consent`：在用户确认之后，把文件内容发给模型，role 为 `import`，提示词 `import_v1.md`。不同类型发送的内容：

| 类型 | 发送内容 |
|---|---|
| image | 作为 `image_url`（data URL）内容块发送 |
| pdf | 有文本时发送前 20,000 字符的文本；没有文本时，用 `page.to_image(resolution=150)` 把前 3 页渲染成 PNG，作为图片内容块发送 |
| xlsx | 第一个工作表的前 200 行，转成 CSV 文本发送 |

- 输出 schema：`{rows: Record<string, string>[], notes_zh: string, notes_en: string}`，最多 200 行。
- 拿到结果后用 CSV 导入同一套校验逐行检查，写入 `errors`，状态改为 `parsed`。
- 写审计 `IMPORT_SENT_TO_MODEL`，摘要为「文件 {filename} 已发送给模型 {model}」。夹具模式同样要写，`{model}` 记为「内置夹具」。
- 夹具模式：按文件字节的 sha256 查找 `fixtures/llm/import.json`。

**确认导入**

| 方法 | 路径 | 说明 |
|---|---|---|
| PUT | `/api/import-jobs/{id}/rows` | 请求体 `{rows}`，重新校验后返回 ImportJob。预览中某个单元格失去焦点时，提交全部行 |
| POST | `/api/import-jobs/{id}/commit` | 有错误时返回 422；没有错误时复用 CSV 导入的新增/覆盖逻辑，并新建基准批次，返回 ImportResult；审计摘要为「对话导入 {filename}：导入 {a} 行，更新 {b} 行」 |
| POST | `/api/import-jobs/{id}/cancel` | 取消任务，返回 ImportJob |

**界面**

- **确认弹窗：** 标题「发送文件给模型？」；正文「「{filename}」的内容将发送给已配置的模型 {model}（{base_url}）用于识别订单。文件可能包含客户、价格和成本信息。」；按钮「发送并识别」「取消」。
- **夹具模式：** 弹窗中的 `{model}` 显示为「内置夹具」，并去掉「（{base_url}）」。
- **未配置模型且没有夹具时：** 助手回复「未配置模型，无法识别该文件。可改用 CSV 模板导入。」
- **C28 导入预览：** 显示在助手消息中。
  - 表格默认显示 8 列：order_id、product、hts10、incoterm、qty、unit_price_usd、customs_value_usd、entry_date；点「显示全部字段」可展开其余字段。
  - 每个单元格都可编辑；有错误的单元格用 `bad` 边框，鼠标悬停显示错误信息。
  - 按钮「确认导入」（`ok` 底；有错误时禁用）和「取消」。

### 6.6 提示词（`agents/prompts/`）

**chat_v1.md**

```
You answer questions for a local tool that tracks how U.S. tariff policy changes affect export orders.
Answer in the language given by "lang" (zh = Simplified Chinese, en = English).
Use only the context entries. If the context does not contain the answer, say so.
Copy every number, date and amount exactly as it appears in the context; never calculate or estimate new numbers.
List the ids of the context entries you used in "citations".
You cannot change orders, decisions, rules or settings; if asked, tell the user which page to use.
Return only a JSON object that matches the schema.
```

**import_v1.md**

```
You transcribe export order data from a file into rows that match the given JSON schema.
Copy values exactly as written in the file. Do not guess, calculate or fill in missing values; leave a field empty if it is not in the file.
Dates must be YYYY-MM-DD. Use the exact field names of the schema.
Return only a JSON object: {"rows": [...], "notes_zh": "...", "notes_en": "..."}; notes list anything you could not read.
```

`LLMClient.complete_json` 新增参数 `images: list[bytes] | None`。传入时，user 消息改为内容块数组，按 OpenAI 格式组织：

```
[{"type":"text","text":...}, {"type":"image_url","image_url":{"url":"data:image/png;base64,..."}}]
```

## 7. 中英文切换

### 7.1 前端

- 切换控件「中 / EN」放在侧栏用户块下方，用 `brut-sm` 样式的分段按钮。
- 选择保存在 `localStorage` 的 `mariner.lang` 中，默认 `zh`；切换时同步设置 `<html lang>` 为 `zh-CN` 或 `en`。
- 新建 `src/i18n/zh.ts`、`src/i18n/en.ts` 和 `useI18n()`（返回 `t(key, params)` 与 `lang`）。
- 界面上的全部字符串都移入字典。`zh.ts` 的值必须与现有中文完全一致。
- 所有请求都带上 `lang` 查询参数。

### 7.2 后端

- 以下接口接受 `lang=zh|en`（缺省 zh），并在原字段中直接返回对应语言的内容：
  - `impacts`（列表和详情）、`briefs`、`watch-items`、`rule-drafts`、`audit`、`decisions`、`kb`、`chat`
  - 错误信息
- 枚举值（风险等级「红橙黄绿」、状态 key 等）保持不变，由前端负责显示。

### 7.3 分诊与抽取

- `TriageResult` 新增 `one_line_en`（≤ 200 字符）。
- `ExtractionResult` 新增 `summary_en`（≤ 300 字符）。
- 新建 `triage_v2.md`、`extract_v2.md`：在 v1 基础上各加一行 `Also return one_line_en / summary_en: the same content in English.`
- 夹具已包含英文字段，见 `backend/fixtures/llm/triage.json` 和 `extract.json`。
- 旧记录没有英文字段时，英文界面显示中文原文。

### 7.4 引擎文本

不改引擎。适配层新增 `engine/i18n.py`，按 `docs/engine_text_templates.json` 处理 actions、risk_reasons 和 flags：

1. **解析：** 把模板中的 `{name}` 换成非贪婪捕获组，整句匹配；risk_reasons 先按「；」拆分。每个字符串必须恰好匹配一个模板。
2. **中文：** 原样返回引擎字符串，只有一处替换：A04、R05 中的 `{watch_title}` 是 rules.json 里的英文标题，中文界面要换成该观察项的中文标题。
3. **英文：** 用 en 模板和解析出的参数渲染。`{watch_title}` 的英文：种子观察项用 §7.5 表中的 title；由草稿新建的观察项用对应文件分诊的 `one_line_en`。多条 risk_reasons 用「; 」连接。
4. **匹配失败：** 返回中文原文，并写一条 warning 日志。
5. **测试：** golden 中所有字符串都能唯一匹配，且用 zh 模板渲染后与原文完全相同。

### 7.5 其他生成内容

- **日报结论（en）：**「There is {a / no} new rate change in force today. Red orders pending: {N}, total profit change {M}.」N = 0 时为「There is {a / no} new rate change in force today. No red orders are pending.」
- **审计：** 新事件写入 `summary`（与 `summary_zh` 相同）、`summary_zh`、`summary_en` 三个字段，全部参与哈希计算。旧事件只有 `summary`，两种语言都显示它。
- **知识库自动条目：** 两种语言分别按 §5.3 生成。
- **对话回答：** 按请求的 `lang` 输出。
- **层名（en）：**

  | id | 英文名 |
  |---|---|
  | MFN | General (MFN) |
  | SEC301_LIST_CN | Section 301 list |
  | SEC301_FORCED_LABOR_CN | Section 301 forced labor |
  | SEC122_GLOBAL | Section 122 surcharge |
  | IEEPA_FENTANYL_CN | IEEPA fentanyl |
  | IEEPA_RECIPROCAL_CN | IEEPA reciprocal |

- **种子观察项（en）：**

  | id | title | summary |
  |---|---|---|
  | W_301_EXCLUSION_EXPIRY | 178 China Section 301 exclusions expire on 11-09 | Exclusions cover goods entered before 23:59 U.S. Eastern on 2026-11-09; no extension notice seen as of 2026-10-31. |
  | W_232_ROBOTICS | Section 232 proclamation on robotics and industrial machinery | Signed 2026-10-28; starts negotiations; no rate, tariff code list or effective date yet; first progress report due around 2027-04-26. |
  | W_301_EXCESS_CAPACITY | Section 301 excess-capacity investigation (China: steel, aluminum, batteries, solar, semiconductors, autos) | Opened 2026-03-11; no final action yet. |

### 7.6 英文文案

- 其余英文文案由 Astra 按下方术语表从中文直译，全部写入 `en.ts` 和后端的 en 模板。
- 完成后生成 `docs/i18n-review.md`，列出全部英文字符串及其对应的中文，供用户审阅。

**术语表：**

| 中文 | 英文 |
|---|---|
| 工作台 | Workbench |
| 风险收件箱 | Risk Inbox |
| 政策日报 | Policy Brief |
| 知识库 | Knowledge Base |
| 规则审核 | Rule Review |
| 智能体流水线 | Agent Pipeline |
| 模型接入 | Model Access |
| 订单影响单 | Order Impact Sheet |
| 采纳建议 | Adopt |
| 不处理 | Dismiss |
| 需补充 | Needs Detail |
| 待处理 | Pending |
| 已采纳 | Adopted |
| 重新计算 | Recalculate |
| + 导入订单 | + Import Orders |
| 可执行建议 | Recommended Actions |
| 规则核验 | Rule Checks |
| 审计日志 | Audit Log |
| 最近处理 | Recent Decisions |
| 临界事件 | Critical Events |
| 处理链 | Processing Chain |
| 基准关税 / 新关税 / 关税增量 | Baseline Duty / New Duty / Duty Change |
| 利润变化 | Profit Change |
| 卖方成本 | Seller Cost |
| 毛利率 | Margin |
| 红 / 橙 / 黄 / 绿 | Red / Orange / Yellow / Green |
| 利好 | Favorable |
| 已生效 / 已签署待生效 / 按期到期 / 拟议 / 调查中 / 谈判中（无税率）/ 法院裁决 / 程序性 | In force / Signed, pending / Scheduled expiry / Proposed / Under investigation / In negotiation (no rate) / Court ruling / Procedural |
| 确认规则 / 驳回 | Approve Rule / Reject |
| 观察项 | Watch Item |
| 第99章税号 | Chapter 99 heading |
| 完税价格 | Customs value |
| 贸易术语 | Incoterm |
| 进口商 | Importer of record |
| 内置夹具 | Built-in fixtures |
| 本地用户 | Local user |
| 立即运行 | Run Now |
| 补充说明 | Detail note |
| 对话可使用订单数据 | Allow order data in chat |

模型调用错误的四类模板：

| 中文 | 英文 |
|---|---|
| 无法连接模型服务 | Cannot reach the model service |
| 模型请求超时 | Model request timed out |
| HTTP {code}：{body} | HTTP {code}: {body} |
| 模型返回内容不是符合要求的 JSON | The model did not return the required JSON |

## 8. 真实环境冒烟测试（P2）

- 新增 `scripts/live_smoke.py`，只依赖后端 venv。它调用已经启动的本地服务（真实模型配置，`COLLECTOR_MODE=live`），逐项输出 PASS 或 FAIL：
  1. health 接口
  2. 测试连接返回 ok
  3. 手动运行一次流水线，流水线状态不是 failed，且 triage 的 errors = 0
  4. 流水线中 `collector_fr` 或 `collector_pi` 的 input > 0（接口有返回）
  5. 对话提问「今天有哪些需要关注的政策？」，得到非空回答，且 `guard.ok=true`
- 该脚本不放进自动化测试。README 新增「真实环境冒烟测试」一节，说明怎么运行。

## 9. 依赖与约束变更

**依赖白名单新增：**

- 前端开发依赖：`prettier`@3
- 后端运行依赖：`openpyxl`@3

**CORS：** 本版接口只用到 GET、POST、PUT、DELETE 方法，现有的 CORS 配置不变。

**404 资源名新增：** 知识条目、对话、导入任务。

**订单数据外发：**

只有以下两种情况允许把订单数据发给模型，其他一律禁止：

1. 导入非本地可解析的文件时，用户在确认弹窗中点击了「发送并识别」。
2. 对话中开启了「对话可使用订单数据」。

两种情况都要写审计。

**数字来源：**

- 模型在对话中只能照抄知识库里已有的数字，由数字守卫检查。
- 导入时模型从文件中抄录的数字，必须经过校验和人工预览确认后才能入库。
- 关税和利润的计算仍然只由引擎完成。

**文案：**

- 中文：照用本文件和 DESIGN 中写出的字符串。
- 英文：按 §7.6 的术语表翻译。
- 新页面的中文文案：照用本文件中「」内的字符串。本文件没写到的中文文案，仍按 AGENTS.md 的流程提问。

## 10. 新增中文文案（以下均为已批准文案）

| 位置 | 文案 |
|---|---|
| 导航 | 工作台 · 风险收件箱 · 政策日报 · 知识库 · 规则审核 · 智能体流水线 · 模型接入 |
| 决策 | 采纳建议（{n}）· 先勾选要采纳的建议 · 补充说明（必填）· 提交 · 取消 · {n}/500 · 已采纳：第 {list} 条 · 补充说明：{note} · 说明 |
| 知识库 | 搜索知识库… · 全部 · 政策 · 观察项 · 规则 · 日报 · 订单 · 影响单 · 手动 · 显示订单数据 · + 新建条目 · 已编辑 · 来源已更新 · 只读 · 编辑 · 保存 · 恢复系统版本 · 来源已更新，当前显示的是你编辑过的版本 · 查看系统版本 · 恢复 · 系统生成，只读 · 删除 · 标题 · 正文 · 暂无条目 |
| 工作台 | 工作台 · 新对话 · 输入问题，或上传订单文件… · 发送 · 对话可使用订单数据 · 开启后，检索到的订单和影响单内容会发送给模型 {model} · 未配置模型：只能回答内置示例问题。 · 去配置 → · 查看日报 → · 引用 · 回答中有知识库里找不到的数字：{list}，请以订单影响单为准 · 思考中… |
| 导入 | 发送文件给模型？ · 发送并识别 · 内置夹具 · 识别中… · 显示全部字段 · 确认导入 · 已导入 {a} 行，更新 {b} 行 · 文件过大（上限 10 MB） · 不支持的文件类型 · 未配置模型，无法识别该文件。可改用 CSV 模板导入。 |
| 语言 | 中 · EN |
| 审计动作 | KB_EDITED 编辑知识 · KB_RESTORED 恢复知识 · KB_CREATED 新建知识 · KB_DELETED 删除知识 · CHAT_ORDER_DATA_SENT 对话外发订单 · IMPORT_SENT_TO_MODEL 文件外发识别 |
