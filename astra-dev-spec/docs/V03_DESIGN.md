# V03_DESIGN.md

v0.3.0 全站改版：视觉换成 Kombai「Vitals」风格，所有页面改为「顶栏 + 侧栏 + 筛选行 + 列表/详情面板」结构。业务逻辑和计算结果不变；接口与前端行为的变化只有 §5、§9 列出的几处。

## 0. 依据与优先级

| 文件 | 作用 |
|---|---|
| `design/tokens-v03.css` | 全部颜色、字号、间距和组件样式。复制到 `frontend/src/app/globals.css`，数值不得修改 |
| `design/mock/*.html` + 同名 `.png` | 各页面的静态样张（1440×900，数据来自 fixture 流水线）。布局、层级、文案位置以样张为准 |
| `design/reference/vitals-reference.html` + `vitals-reference-1440.png` | Vitals 原始快照，只作参照，不要复制其中的英文内容 |

- 本文件与 `docs/DESIGN.md` 冲突时，以本文件为准。
- `docs/DESIGN.md` 中仍然有效的部分：§7 格式、§8 文案、§11 中的「审计动作中文」和「合同关税条款显示」。其余视觉、布局、组件、动效规则全部作废。
- 已批准文案：`frontend/src/i18n/zh.ts` / `en.ts` 中已有的字符串（包括 DESIGN.md §4、§9 表格里的文案）都视为已批准，可以直接使用；本次新增的文案见 §11。
- 样张里的数字、订单、对话内容只是示例，界面上一律显示接口返回的真实数据。
- 样张中少量 inline style（间距微调、数据驱动的颜色和宽度）按原值照抄。
- 样张「订单风险收件箱 · 详情标签页（逐个展开）」把各标签页内容逐个展开，`review` 样张在面板底部额外展示了「原文」标签页，都只用来展示样式；实际界面一次只显示当前标签页。

样张与页面对应：

| 页面 | 样张 |
|---|---|
| `/` 工作台 | `workbench`、`workbench-consent` |
| `/inbox` | `inbox`、`inbox-tabs` |
| `/brief` | `brief` |
| `/knowledge` | `knowledge`、`knowledge-deleted` |
| `/review` | `review` |
| `/pipeline` | `pipeline` |
| `/settings` | `settings` |
| 外壳（顶栏、侧栏） | 所有样张相同 |

## 1. 令牌

### 1.1 颜色

| 令牌 | 值 | 用途 |
|---|---|---|
| `ink-900` | `#101423` | 主文字、标题、选中的分段按钮底色、列表选中竖条 |
| `ink-800` | `#1b2032` | 卡片标签、表格正文、刻度线 |
| `ink-700` | `#333a4d` | 导航文字、正文段落 |
| `ink-500` | `#6b7182` | 次级文字、图标、表头 |
| `ink-400` | `#8b91a2` | 说明文字、时间、单位、坐标轴文字 |
| `ink-300` | `#c2c6d1` | 弱化的图形、空状态图标 |
| `ink-200` | `#e2e4ea` | 所有边框和分隔线 |
| `ink-100` | `#eef0f4` | 进度条底色、中性标签底色 |
| `surface` | `#f7f8fb` | 页面底色、列表选中底色、条目块底色 |
| `white` | `#ffffff` | 顶栏、侧栏、面板、输入框 |
| `brand` / `brand-dark` / `brand-soft` | `#3d3aef` / `#26216b` / `#eceafd` | 主按钮、链接、当前导航、「今天」、用户消息、引用标签、勾选状态、等待你决定的节点 |
| `good` / `good-soft` | `#0a9a6b` / `#e3f7ef` | 风险「绿」、通过、完成、已采纳、已接入 |
| `warn` / `warn-soft` | `#c8790a` / `#fdf1de` | 风险「橙」、注意、需补充、待确认、倒计时 ≤ 7 天、规则边界 |
| `caution` / `caution-soft` | `#9c8500` / `#faf5d7` | 风险「黄」（Vitals 没有第四档，这是新增值） |
| `bad` / `bad-soft` | `#d13a53` / `#fbe7ea` | 风险「红」、不通过、失败、不处理、删除、错误 |

Logo 的蓝色不进入界面配色。

### 1.2 字体

- 只用系统字体栈：`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif`。
- 不再使用等宽字体；数字统一用 `tabular-nums`（已写在 body 上）。
- 删除 `next/font/google` 的全部字体（Archivo、Hanken Grotesk、Space Mono、Noto Sans SC），以及 E2E 和构建中为它们准备的字体夹具（`NEXT_FONT_GOOGLE_MOCKED_RESPONSES`、`scripts/prepare-test-fonts.cjs` 等）。

### 1.3 字号

| 场景 | 字号 / 字重 |
|---|---|
| 详情标题 `.detail-heading` | 23px / 700 |
| 指标数值 `.metric-value` | 22px / 700；文字类数值（状态、模型名、耗时）用 `.metric-value.sm`，18px |
| 状态句 `.score-status`、对话标题、日报条目标题 `.entry-title` | 15px（标题 600，其余 700） |
| 顶栏页面标题 `.topbar-title` | 14.5px / 600 |
| 正文 | 14px / 400 |
| 导航、卡片标签、标签页、段落、表格正文 | 13.5px（标签和标签页 600） |
| 控件文字（分段按钮、下拉框、按钮、链接） | 13px；侧栏搜索框内文字 12.5px |
| 详情上方小标题 `.device-tag`、图例、状态旗标、统计标签 | 12.5px / 600 |
| 单位、时间、表头、坐标轴、说明 | 12px |
| 标签 `.chip`、徽章、快捷键 `.kbd` | 11px / 600；筛选行里的状态标签用 `.chip.lg`（12.5px） |

### 1.4 其他

- 圆角：6px（控件）、10px（横幅、小卡）、14px（面板、卡片、弹窗）；标签和统计标签用 999px。
- 投影：只有弹窗使用 `0 20px 50px rgba(16,20,35,.18)`，其他元素一律无投影。
- 动效：只保留 `.switch` 的 120ms 过渡。删除 GSAP、anime.js 的全部动画（卡片入场、文档入场、按钮入场、盖章、抖动）。
- 焦点：`:focus-visible` 显示 2px `brand` 描边，偏移 2px。
- 最小宽度仍为 1280px，不做移动端适配；`vitals-reference.html` 里的 980px / 640px 断点不采用。

## 2. 状态配色

除特别说明外，都用 `.chip` 加对应的修饰类；圆点用 `.dot` 加同名修饰类。

| 对象 | 值 → 修饰类 |
|---|---|
| 风险等级（标签、金额、条形、环形图） | 红 → `bad`，橙 → `warn`，黄 → `caution`，绿 → `good` |
| 决策状态 | 待处理 → 无修饰（`ink-100` 底），已采纳 → `good`，不处理 → `bad`，需补充 → `warn` |
| 倒计时标签 | 前置 `IconClock`；「入境 {n}天」「规则边界 {n}天」：n ≤ 7 → `warn`，n < 0 → `bad`，其余 → `outline`；「已入境」→ 无修饰；入境日已过 → `bad`「已过入境日」 |
| 利好 | `good` |
| 法律状态、变更类型 | `outline` |
| 日报条目类型、知识库类型 | 无修饰 |
| 草稿状态 | 待确认 → `warn`，需补充 → `warn`，已确认 → `good`，已驳回 → `bad` |
| 步骤状态 | 等待 → 无修饰，运行中 → `warn`，完成 → `good`，失败 → `bad`，无夹具跳过 → `caution` |
| 流水线状态 | 运行中 → `warn`，完成 → `good`，部分完成 → `warn`，失败 → `bad` |
| 规则核验、校验项 | 不通过 → `bad`，注意 → `warn`，通过 → `good`；不适用的处理见 §6.5 |
| 临界事件 severity | 与风险等级相同 |
| 知识库标记「已编辑」「来源已更新」「只读」 | `brand`、`warn`、无修饰 |

## 3. 外壳

### 3.1 顶栏（`.topbar`，高 60px，滚动时固定在顶部）

| 位置 | 内容 |
|---|---|
| 左侧 264px（`.topbar-org`） | 26×26 的 `/favicon.png`（`.org-logo`）+「Mariner AI」+ 徽章 `.plan-badge`「v0.3.0」。版本文字写在前端常量里，与 `VERSION` 文件保持一致。没有下拉箭头 |
| 中部左 | `.project-picker`：18px 黑底圆角方块内放 `IconFileText`，后接「税则 {hts_release}」。不可点击 |
| 中部 | `<h1 class="topbar-title">`：页面标题，沿用现有 h1 文案——工作台、订单风险收件箱、政策日报、知识库、规则审核、智能体流水线、模型接入 |
| 右侧 | `.topbar-clock`：「北京时间 YYYY-MM-DD HH:mm」，每秒刷新 |

原顶栏的大标题行、计数标签、时间行、搜索框和主按钮全部移除。计算批次号移到收件箱标签页行右侧（§6.2），流水线运行号移到流水线筛选行（§6.6）。

### 3.2 侧栏（`.sidebar`，宽 264px，固定在顶栏下方，高度 `100vh − 60px`，内容超出时自身滚动）

从上到下：

1. **搜索框** `.search-box`：前置 `IconSearch`，占位文字「搜索订单号、品名、HS 编码…」，右侧 `.kbd` 显示 `{modifierLabel()} K`（Windows「Ctrl K」，macOS「⌘ K」，沿用现有 `lib/platform.ts`）。行为见 §9.2。
2. **导航** `.nav-list`，顺序：工作台、风险收件箱、政策日报、知识库、规则审核、智能体流水线。图标沿用现有 Tabler 图标，16px。风险收件箱右侧 `.nav-count` = `counts.pending`，规则审核右侧 `.nav-count` = `counts.drafts_pending`。当前页加 `.active`。
3. **底部区** `.sidebar-bottom`（贴底）：
   - `.today-card`：「今日已处理」；数值 `today.processed`，后接小字「/ {today.total} 单」；下方 `.stack-bar` 依次是采纳（`good`）、不处理（`bad`）、需补充（`warn`），每段宽度 = 该数量 ÷ `today.total`（total 为 0 时三段都为 0）。
   - 导航项「模型接入」，右侧 `.nav-hint`「已接入」或「未接入」。
   - `.sidebar-profile`：圆形头像（`ink-100` 底，文字「本」）+「本地用户」+ 右侧 `.segmented.mini` 语言切换「中 / EN」（行为与 v0.2 相同）。

### 3.3 内容区（`.content`，内边距 22px 28px 40px，`surface` 底）

- 第一行是筛选行 `.filter-row`（高 38px，元素间距 14px），各页内容见 §6。
- 第二块是面板 `.panels.fill`：左列 280px、右侧为详情；面板高度 `calc(100vh − 180px)`（最小 520px），左列和详情各自滚动。
- 面板之后如果还有区块，用 `.card`，间距 20px。

## 4. 组件

| 编号 | 名称 | 样式类 | 替代的旧组件 |
|---|---|---|---|
| V01 | AppTopbar | `.topbar` 一组 | 顶栏、C25 BrandBlock |
| V02 | Sidebar | `.sidebar` 一组 | C01 SidebarNavItem、C02 CountBadge、C21 SidebarStatCard、用户块、语言切换 |
| V03 | FilterRow | `.filter-row`、`.spacer`、`.segmented`（`.seg-count`）、`.dropdown`（`.dropdown-label` + `select`）、`.date-range`、`.stat-chip`（数字放在 `<b>` 中，前置 `.dot`） | C20 Tabs（收件箱「全部 / 紧急」） |
| V04 | Button | `.btn`、`.btn-primary`、`.btn-good`、`.btn-warn`、`.btn-bad-outline`、`.btn-warn-outline`、`.btn-danger-text`、`.btn-block`、`.icon-btn`（`.ghost`） | C19 PrimaryButton、C11 StampButton |
| V05 | Panels | `.panels.fill`、`.metrics-list`、`.list-head`、`.detail-panel`、`.card`、`.card-head` | 队列栏 + 详情栏 + 操作栏 |
| V06 | MetricCard | `.metric-card`（`.active` / `.static` / `.compact`）、`.metric-label`（`.clamp`）、`.metric-value-row`、`.metric-value`（`.sm`）、`.metric-unit`、`.metric-bar`（`<i>` 填充、`<b>` 标记线）、`.metric-meta`、`.tone-*` | C05 ImpactCard、草稿卡、知识条目卡 |
| V07 | ScoreRing | SVG，见 §7 | — |
| V08 | DetailTop | `.detail-top`（`.pad-bottom`）、`.detail-left`（`.wide` / `.form`）、`.device-tag`、`.detail-heading`、`.score-row`、`.score-status`、`.score-flag`（`.bad` / `.muted`）、`.detail-copy`（`.hint`）、`.learn-link`、`.detail-actions`、`.detail-body`、`.body-text`、`.inline-panel` | C07 ImpactDocument 头部、C08 KeyValueGrid、C17 BigStamp |
| V09 | KeyDatesTimeline | `.chart-wrap`、`.chart-head`、`.chart-title`、`.legend-row`、`.legend-item`、`.legend-dot`（`.fill` / `.dashed`），SVG 见 §8 | — |
| V10 | TabsRow | `.tabs-row`、`.tab`（`.active`）、`.tab-count`、`.tabs-spacer`（放在 `.tabs-suffix` 之前）、`.tabs-suffix`、`.tab-body` | — |
| V11 | SeverityGrid | `.route-grid`、`.route-col`、`.route-col-head`（`.tag` + `.range`）、`.route-entry`、`.route-path`、`.route-visits`、`.route-score`、`.route-empty` | C12 RuleCheckPanel、C16 CriticalEventsPanel、校验结果面板 |
| V12 | EntryList | `.entry-list` + `.route-entry`（`.selectable` / `.selected` / `.card-like`）、`.check`、`.entry-no`、`.entry-title` | C22 ActionList、日报条目 |
| V13 | Table | `.table`（`.num` 右对齐，`tfoot`，`tr.total`，`td.tone-*`） | C09 LayerTable、C23 ProfitTable、C14 DecisionHistoryTable、步骤表 |
| V14 | Chip | `.chip` + 修饰类（`bad` / `warn` / `caution` / `good` / `brand` / `outline` / `lg`）、`.chips` | C03 Tag、C06 ChainDots |
| V15 | Banner | `.banner.warn` / `.bad` / `.info`，内部可放 `.spacer` 和按钮 | 各类横幅、C24 ErrorBanner |
| V16 | States | `.empty`（图标统一用 `IconInbox`）、`.loading` | C24 LoadingPanel、EmptyPanel |
| V17 | Form | `.field`、`.input`、`.textarea`、`.select`、`.field-help`、`.switch`（`.on`，内含 `.track`） | C26 TextField、复选框开关 |
| V18 | Chat | `.chat`、`.chat-head`、`.chat-title`、`.chat-scroll`、`.msg.user` / `.assistant` / `.error`、`.msg-meta`、`.chat-input` | C27 对话面板 |
| V19 | ConversationItem | `.conv-item`（`.active`）、`.conv-text`、`.conv-title`、`.conv-time` | v0.2.1 对话记录栏 |
| V20 | Modal | `.overlay`、`.modal`、`.modal-head` / `-body` / `-foot` | 导入确认弹窗、导入对话框 |
| V21 | Flow | `.flow`、`.arrow`、`.flow-node`（`.good` / `.warn` / `.bad` / `.brand` / `.dashed`） | C10 ProcessChain、C15 PipelineFlow |
| V22 | AuditTable | V13 表格，列：时间 / 动作 / 执行者 / 摘要 | C13 AuditLog |
| — | 其他 | `.kv`（`.cols-2` / `.cols-5`，`dd.big`）、`.mark`、`.source-text`、`.disclaimer` | — |

浏览器原生 confirm 弹窗保持不变。

## 5. 通用行为

- 列表点击选中：选中项加 `.active`，并写入 URL。收件箱 `?order=`、知识库 `?id=`、工作台 `?c=` 与现在相同；规则审核 `?draft=`、流水线 `?step=` 为新增。
- URL 中没有选中参数时，默认选中列表第一项（流水线例外，见 §6.6）。列表为空时，详情显示 `.empty`，文案沿用各页现有空状态。
- 按钮禁用：加 `disabled`，样式由 `.btn:disabled` 提供。
- 加载中：详情或列表显示 `.loading`「加载中…」。
- 接口出错：在筛选行下方显示 `.banner.bad`，内容为接口返回的 `error.message`，右侧「重试」按钮（`.btn`）重新请求。

## 6. 页面

### 6.1 工作台 `/`

**筛选行：**

| 元素 | 内容 | 点击 |
|---|---|---|
| `a.stat-chip` | `.dot.muted` +「{counts.pending} 待处理」 | `/inbox` |
| `span.stat-chip` | `.dot.bad` +「{counts.red} 红色」 | 不可点击 |
| `a.stat-chip` | `.dot.warn` +「{counts.urgent} 紧急」 | `/inbox?tab=urgent` |
| `a.stat-chip` | `.dot.caution` +「{n} 临界事件」，n = `/api/watch-items` 的条数 | `/inbox#watch-events` |
| `.spacer` | | |
| `a.date-range` | `IconNews` +「政策日报 {最新日报日期}」；没有日报时不显示 | `/brief` |

原右栏的三张概况卡（收件箱、日报、临界事件）删除。

**面板：**

- **左列：** `.list-head` 内放整宽按钮「+ 新对话」（`.btn.btn-block`）；下面是对话列表（V19），每项两行：标题（两行截断）和「MM-DD HH:mm」。鼠标悬停时右侧显示 `IconTrash`（`.icon-btn.ghost`），确认文字和删除后的行为沿用 v0.2.1。列表为空时显示 `.empty`「还没有对话」。
- **右侧 `.chat`：**
  - `.chat-head`：对话标题（与列表相同）+ 右侧 `.device-tag` 显示创建时间「MM-DD HH:mm」。没有对话时不显示 `.chat-head`。
  - `.chat-scroll`：
    - 未配置模型时，最上方显示 `.banner.warn`（`IconAlertTriangle`）：「未配置模型：只能回答内置示例问题。」，右侧链接「去配置 →」。
    - 用户消息 `.msg.user` 靠右；助手消息 `.msg.assistant` 靠左；失败消息 `.msg.error`，内含「重试」按钮（`.btn`，前置 `IconRefresh`）。
    - 引用：助手消息内 `.chips`，每个引用是 `a.chip.brand`，点击跳转 `/knowledge?id=`。
    - 数字守卫未通过：在该助手消息上方显示 `.banner.bad`，文案不变。
    - 「思考中…」显示为一条 `.msg.assistant`，文字颜色 `ink-400`。
  - `.chat-input`：
    1. `.switch`「对话可使用订单数据」；打开时其下显示 `.banner.info`「开启后，检索到的订单和影响单内容会发送给模型 {model}」。
    2. `.textarea`，3 行，占位文字「输入问题，或上传订单文件…」。按键行为不变。
    3. 左侧附件按钮 `.icon-btn`（`IconPaperclip`），右侧「发送」（`.btn.btn-primary`，前置 `IconSend`）。
- **导入确认弹窗（V20）：** 标题、正文、按钮文案不变；「取消」为 `.btn`，「发送并识别」为 `.btn.btn-primary`，「取消」在左。
- **导入预览 C28：** 放在助手消息内，该消息宽度改为 100%。表格用 `.table`，单元格内编辑用 `.input`（高 30px、内边距 4px 8px）；有错误的单元格底色 `bad-soft`，表格下方逐条列出错误（12px，`bad` 色）。按钮「确认导入」为 `.btn.btn-good`，「取消」为 `.btn`。列、校验与行为不变。

### 6.2 风险收件箱 `/inbox`

**筛选行：**

1. `.segmented`：「全部」「紧急 {counts.urgent}」（数字放在 `.seg-count` 中；「全部」不带数字）。选中「紧急」时 URL 为 `?tab=urgent`。
2. `.dropdown`：标签「贸易术语」+ `select`（全部 / DDP / 非 DDP）。
3. `.spacer`。
4. `.date-range`：`IconCalendar` +「规则快照 {as_of}」。
5. `.btn`「重新计算」（前置 `IconRefresh`）；运行中禁用。
6. `.btn.btn-primary`「+ 导入订单」：打开 CSV 导入对话框（V20）。标题「导入订单 CSV」；正文为文件选择（`.input type=file`）；失败时正文下方显示 `.banner.bad`「文件未导入，请修正以下错误」及错误列表（每行「第 {row} 行 · {field} · {message}」，12px）；成功时显示 `.banner.info`「已导入 {a} 行，更新 {b} 行」；底部「取消」（`.btn`）和「上传」（`.btn.btn-primary`）。行为不变。

**左列：**

- `.list-head`：一行 12px `ink-400` 文字「排序：预计入境 最近优先 ↓」。
- 每张订单卡（V06），从上到下：
  1. `.metric-label.clamp`：「{order_id} · {product}」。
  2. `.metric-value-row`：利润变化（带符号），颜色按风险等级；单位「USD」。
  3. `.metric-bar`：见 §7.2。
  4. `.metric-meta`：「税率 {rate_baseline_user_pct} → {rate_new_pct}」。
  5. `.metric-meta.chips`：风险等级标签、倒计时标签、「利好」（`tag` 为利好时）、决策状态（非待处理时）。
- 原有的处理链圆点、编号签、B/E 方块不再显示。

**详情 `.detail-top` 左侧：**

1. `.device-tag`：「{order_id} · HTS {hts10} · {incoterm} · {渠道} · {合同关税条款} · 进口商：{卖方/买方}…」。渠道显示「B2B」或「电商」；合同关税条款按 DESIGN §11 显示；进口商部分沿用现有文案（「进口商：卖方（DDP）」或「进口商：买方（{incoterm}）」）。可以换行。
2. `.detail-heading`：品名。
3. `.score-row`：环形图（§7.1）+ 右侧两行：
   - `.score-status`，颜色按风险等级：「红色风险」「橙色风险」「黄色风险」「绿色风险」。
   - `.score-flag`：倒计时文字（与卡片标签相同）。倒计时标签为 `warn` 时用 `.score-flag` 并前置 `IconAlertTriangle`；为 `bad` 时用 `.score-flag.bad` 并前置 `IconAlertTriangle`；其余情况用 `.score-flag.muted` 并前置 `IconClock`。
4. `.detail-copy.hint`：「原因：{risk_reasons}」。
5. `.detail-copy`：「综合税率 {rate_baseline_user_pct} → {rate_new_pct}，关税增量 {duty_delta_usd}；利润 {seller_profit_baseline_usd} → {seller_profit_new_usd}，毛利率 {margin_baseline_pct} → {margin_new_pct}。」所有数字直接取接口字段，按 DESIGN §7 格式化，前端不做计算。

**详情 `.detail-top` 右侧 `.detail-actions`（替代原操作栏和印章）：**

1. 决策状态标签：待处理 / 已采纳 / 不处理 / 需补充（§2）。标签下方 12px `ink-500` 文字：有 `adopted_actions` 时显示「已采纳：第 01、03 条」；有 `note` 时显示「补充说明：{note}」（最多 2 行，完整内容放在 title 属性）。规则与 v0.2 相同。
2. 按钮行：「采纳建议（{n}）」（`.btn.btn-good`，前置 `IconCheck`）、「不处理」（`.btn.btn-bad-outline`，前置 `IconX`）、「需补充」（`.btn.btn-warn-outline`，前置 `IconInfoCircle`）。可用条件和快捷键不变。
3. 快捷键提示行：三个 `.kbd`，分别为「{modifierLabel()} Enter」「{modifierLabel()} Backspace」「{modifierLabel()} D」。

**需补充面板：** 点击「需补充」或按 Ctrl/⌘+D 后，在 `.detail-top` 与关键日期之间展开 `.inline-panel`；内容、字数统计和快捷键沿用 v0.2；按钮顺序为「提交」（`.btn.btn-warn`）、「取消」（`.btn`）。

**关键日期（`.chart-wrap`）：** `.chart-head` 左侧 `.chart-title`「关键日期」，右侧图例；图形和图例见 §8。

**标签页（`.tabs-row`）：** 可执行建议（`.tab-count` = 建议条数，默认选中）· 税率分层 · 利润 · 规则核验 · 处理链；`.tabs-spacer` 之后 `.tabs-suffix` = 计算批次号 `run_id`。

| 标签页 | 内容 |
|---|---|
| 可执行建议 | `.entry-list`。每条为 `.route-entry.selectable`：`.check` 复选框（勾选时内放 `IconCheck`）+ `.entry-no`「01」+ 正文（14px 不加粗）。勾选后加 `.selected`。按 Ctrl/⌘+Enter 且未勾选任何建议时，自动切到本标签页，在列表上方显示 `.banner.warn`「先勾选要采纳的建议」2 秒。列表下方 `.disclaimer` 显示免责声明 |
| 税率分层 | `.table`，列：层 / 第99章税号 / 税率 / 关税额。`tfoot` 三行：基准关税（填写 x%）、新关税、关税增量；关税增量行加 `.total`，金额 `td` 加 `.tone-bad`（增加）或 `.tone-good`（减少），为 0 时不加 |
| 利润 | `.table`，行：收入 / 卖方成本 / 利润 / 毛利率；列：基准 / 重算 / 变化。重算利润和利润变化两格按正负加 `.tone-good` / `.tone-bad`，其他格不着色 |
| 规则核验 | V11 三栏：不通过（`IconAlertCircle`）/ 注意（`IconAlertTriangle`）/ 通过（`IconCircleCheck`），每栏右上角 `.range` 显示条数。每项一条 `.route-entry`：左侧核验名称，右侧 `value`（有时显示）。空栏显示 `.route-empty`（`IconCircleCheck`）：「没有不通过项」「没有注意项」「没有通过项」 |
| 处理链 | V21，节点来自 `agent_chain`，文字沿用现有实现。配色：done → `good`；failed → `bad`；skipped、not_run → 无修饰；human 节点为 pending 时 → `brand`，文字「你（待决定）」。`checks` 中 `unverified_fields` 为 warn 时，末尾追加 `.flow-node.dashed`「报关行复核（含未核实字段时）」 |

**面板下方：**

1. `.card#watch-events`：`.card-head`「临界事件」（前置 `IconAlertTriangle`），右侧 `.suffix` 为条数。内容为 `.route-grid`，每条临界事件一栏（每行 3 栏，超过 3 条时换行）：
   - 栏头：按 severity 着色的 `.tag`（红用 `IconFlame`，其余用 `IconAlertTriangle`）+ 法律状态文字；右侧 `.range` = `next_milestone`，没有时显示「—」。
   - 第一条 `.route-entry`：标题。
   - 第二条 `.route-entry`：左侧「影响 {n} 单 · {金额}」（无金额时为「影响 {n} 单 · 暂无税率」，n = 0 时为「暂无受影响订单」），右侧受影响订单号。
   - 没有临界事件时，卡片内显示 `.empty`「暂无临界事件」。
2. `.card`：`.card-head`「最近处理」（前置 `IconClock`），`.table` 列：订单号 / 品名 / 利润变化 / 处理人 / 时间 / 状态 / 说明；利润变化格按风险色加 `.tone-*`；状态为决策标签；说明列规则同 v0.2；最新 4 条。没有记录时显示 `.empty`「暂无处理记录」。

原收件箱里的「审计日志」和「智能体流水线」区块删除，这两部分只在 `/pipeline` 显示。

### 6.3 政策日报 `/brief`

- **筛选行：** `.dropdown`（标签「日期」+ `select`，选项来自 `/api/briefs`，默认最新）；`.spacer`；`.date-range`：`IconClock` +「生成于 {generated_at 的 MM-DD HH:mm}」。
- **左列：** `.list-head` 内 `.chart-title`「订单汇总」；下面是 `.metric-card.static`：
  - 订单总数（单位「单」，无条形）。
  - 红、橙、黄、绿：数值颜色按风险等级，单位「单」；条形宽度 = 该等级数量 ÷ 订单总数。
  - 合计利润变化：带符号，按正负着色，单位「USD」。
  - 潜在退款：大于 0 时用 `good` 色，单位「USD」。
- **详情：**
  - `.detail-top`，`.detail-left.wide`：`.device-tag`「美国关税政策日报」；`.detail-heading` = 日期；`.score-status` = 结论（`ink-900`）；`.detail-copy.hint`「结论按生成时的订单状态计算，之后的决策和重算不会更新这句话。」
  - 标签页：全部 · 政策 · 到期 · 观察 · 预警（尚未正式发布），`.tab-count` 为前端按 `kind` 统计的条数；数量为 0 的标签页照常显示。
  - 条目列表 `.entry-list`，每条 `.route-entry.card-like`，从上到下：
    1. `.chips`：法律状态（`outline`）、条目类型；未确认的条目再加 `warn`「待确认」。
    2. `.entry-title`：标题。
    3. 「原文标题：…」（有时显示），12px `ink-400`。
    4. 摘要（`.body-text`）。
    5. 有受影响订单时：`.metric-meta`「受影响订单 · {订单号}」+ 金额（按正负着色）。
    6. `.learn-link`「原文」+ `IconArrowUpRight`。
- 没有日报时，面板内显示 `.empty`「还没有日报」。

### 6.4 知识库 `/knowledge`

- **筛选行：** `.dropdown`「类型」+ `select`（全部 / 政策 / 观察项 / 规则 / 日报 / 订单 / 影响单 / 手动 / 已删除）；`.switch`「显示订单数据」；`.spacer`；`.btn.btn-primary`「+ 新建条目」。
- **左列：** `.list-head` 内放搜索框（`.search-box`，占位「搜索知识库…」，无快捷键提示）。条目为 `.metric-card.compact`：标题（`.metric-label.clamp`），下面一行标签：类型、「已编辑」「来源已更新」「只读」（有时显示）。列表为空时 `.empty`「暂无条目」。
- **详情（未删除的条目）：**
  - `source_changed` 为 true：最上方（`.detail-body` 内）`.banner.warn`「来源已更新，当前显示的是你编辑过的版本」，右侧「查看系统版本」「恢复」两个按钮；展开的系统版本显示在横幅下方的 `.inline-panel` 中。
  - `.detail-top`，`.detail-left.wide`：`.device-tag`「{类型} · 更新于 {MM-DD HH:mm}」，`.detail-heading` = 标题。右侧 `.detail-actions`：「编辑」（`.btn`，`IconPencil`）、「恢复系统版本」（`.btn`，`IconRestore`，仅当前语言被编辑过时显示）、「删除」（`.btn.btn-danger-text`，`IconTrash`）。只读条目不显示「编辑」，改为标签「系统生成，只读」。
  - 正文：`.detail-body` 内 `.body-text`。
  - 编辑状态：标题 `.input`、正文 `.textarea`（12 行），下方「保存」（`.btn.btn-primary`）和「取消」（`.btn`）。新建条目使用同一编辑器。
- **详情（已删除的条目）：** 最上方 `.banner.warn`（`IconTrash`）「已删除」，右侧「恢复」按钮（`.btn`，`IconRestore`）；不显示「编辑」「恢复系统版本」「删除」；标题和正文照常显示。
- 删除确认文字和行为沿用 v0.2.1。

### 6.5 规则审核 `/review`

- **筛选行：** 四个不可点击的 `span.stat-chip`：「{n} 待确认」（`.dot.warn`）、「{n} 需补充」（`.dot.warn`）、「{n} 已确认」（`.dot.good`）、「{n} 已驳回」（`.dot.bad`）。n 由前端按 `/api/rule-drafts` 列表中的 `status` 统计。
- **左列：** 草稿卡（V06）：
  1. `.metric-label.clamp`：「{source_document_number} · {标题}」。
  2. 数值：`impact_preview.profit_delta_usd`，带符号；负数 `.tone-bad`，正数 `.tone-good`，0 用 `.tone-muted`；没有预估时显示「—」（`.tone-muted`）；单位「预估影响 · USD」。
  3. `.chips`：法律状态、变更类型、草稿状态。
  - 排序沿用现有规则。选中写入 `?draft=`。列表为空时 `.empty`「暂无待确认的规则草稿」。
- **详情：**
  - `.detail-top` 左侧：`.device-tag` = `source_document_number`；`.detail-heading` = 标题；`.chips`（与卡片相同）；`.detail-copy.hint`「原文标题：…」；`.detail-copy` = 摘要；`.learn-link`「原文」+ `IconArrowUpRight`。
  - 右侧 `.detail-actions`：「确认规则」（`.btn.btn-good`，`IconCheck`）、「驳回」（`.btn.btn-bad-outline`，`IconX`）、「需补充」（`.btn.btn-warn-outline`，`IconInfoCircle`）；可用条件和后续交互不变。
  - 标签页：校验结果（默认）· 原文 · 预估影响。
    - 校验结果：V11 三栏（不通过 / 注意 / 通过），每项为「V1 原文引用逐字命中」这样的 `.route-entry`，空栏文案同 §6.2。三栏下方 `.tab-body` 内一行 12px `ink-400`：「不适用：V2、V3…」（没有不适用项时不显示）。
    - 原文：`.tab-body` 内 `.source-text`，evidence 片段用 `.mark` 高亮。
    - 预估影响：`.tab-body` 内 `.kv.cols-2`：「受影响订单」（订单数）、「利润变化」（金额）；没有预估时两项都显示「—」。

### 6.6 智能体流水线 `/pipeline`

- **筛选行：** 流水线状态 `.chip.lg`；触发方式 `span.stat-chip`（「手动」或「每日 07:30」）；`.date-range`：`IconClock` + 运行号；`.spacer`；`.btn.btn-primary`「立即运行」（前置 `IconRefresh`，运行中禁用）。
- **左列：** 每个步骤一张 `.metric-card.compact`：智能体名称；数值 = 耗时（`.metric-value.sm`，单位「ms」，未结束时显示「—」）；右侧步骤状态标签；下方 `.metric-bar` 整条填满，颜色按步骤状态（等待 `.tone-muted`，运行中 `.tone-warn`，完成 `.tone-good`，失败 `.tone-bad`，无夹具跳过 `.tone-caution`）。选中写入 `?step=`，默认选中第一个失败的步骤，没有失败时选第一个。
- **详情：**
  - `.detail-top`，`.detail-left.wide`：`.device-tag`「智能体 · {agent}」；`.detail-heading` = 智能体名称；`.kv.cols-5`：输入、输出、跳过、错误、耗时（`dd.big`，耗时后接 `.metric-unit`「ms」）；步骤有 `message` 时，在下方显示 `.banner.bad`（失败时）或 `.detail-copy`（其他状态）。
  - `.chart-wrap`：`.chart-title`「智能体流水线」，内容为 V21 九个节点：触发 → 采集 → 分诊 → 抽取 → 校验 → 人工确认 → 计算 → 日报 → 完成。配色按 §2 和 API.md §6：触发无修饰；计算 `good`；人工确认在 `drafts_pending` > 0 时为 `warn`，文字「人工确认 · {n} 待确认」，等于 0 时为 `good`，文字「人工确认」。
  - 标签页：步骤（默认）· 审计日志；`.tabs-spacer` 之后 `.tabs-suffix`「不可篡改 · SHA-256 链式」。
    - 步骤：`.table`，7 列：智能体 / 状态 / 输入 / 输出 / 跳过 / 错误 / 耗时；数字列右对齐；行加 `.clickable`，点击一行等同于点击左列对应的卡片。
    - 审计日志：V22，最新 20 条；时间格式 `YYYY-MM-DD HH:mm:ss`（北京时间）；动作显示 DESIGN §11 的中文名。
- 从未运行过流水线时：筛选行只有「立即运行」；面板内显示 `.empty`「还没有运行记录」。
- 运行中每 2 秒刷新，不变。

### 6.7 模型接入 `/settings`

- **筛选行：** 已接入为 `.chip.good.lg`「已接入」，未接入为 `.chip.warn.lg`「未接入（使用内置夹具）」。
- **左列（全部为 `.metric-card.static`，数值用 `.metric-value.sm`）：**
  1. 「连接状态」：「已接入」（`.tone-good`）或「未接入」（`.tone-warn`），下方整条 `.metric-bar`，颜色相同。
  2. 「模型名称」：模型 ID，未配置时显示「—」。
  3. 「测试连接」：取 `GET /api/settings/llm` 的 `last_test`：`ok` 为 true 时显示 `latency_ms`（`.tone-good`，单位「ms」）；为 false 时显示「连接失败」（`.tone-bad`）；`last_test` 为 null 时显示「—」。点击「测试连接」后刷新。
- **详情：** `.detail-top.pad-bottom`，`.detail-left.form`：
  - `.device-tag`「OpenAI Chat Completions」；`.detail-heading`「模型接入」。
  - 三个 `.field`：接口地址、API Key（password）、模型名称；占位文字和「已保存 {masked}，留空则不修改」（`.field-help`）不变。
  - 按钮：「保存」（`.btn.btn-primary`）、「测试连接」（`.btn`）、「清除配置」（`.btn.btn-danger-text`）。
  - 测试结果一行（`.detail-copy`，600 字重）：成功用 `good` 色、失败用 `bad` 色，文案不变。
  - `.detail-copy.hint`：接口格式说明，文案不变。

### 6.8 组件页 `/dev/components`

改为展示 V01–V22 的全部状态：风险四色的卡片与标签、环形图（红 41.9% / 基准 16.9%，绿 12.5% / 基准 20.0%，超过 100% 的 145.0%）、时间轴（含规则边界和不含规则边界各一个，以及一个已入境的订单）、三种消息、全部按钮及禁用态、三种横幅、空状态、加载态、开关两种状态、弹窗。

## 7. 环形图与严重度条

### 7.1 环形图（收件箱详情，66×66）

- 圆心 (33,33)，半径 27，线宽 7，轨道色 `#eef0f4`，进度色 = 风险色，`stroke-linecap: round`，从 12 点方向顺时针。
- 进度 = `min(rate_new_pct, 100) / 100`；`stroke-dasharray` = 2π×27，`stroke-dashoffset` = 周长 × (1 − 进度)。
- 基准刻度：在 `min(rate_baseline_user_pct, 100) / 100 × 360°` 的位置画一条径向短线，从半径 21.5 到 32.5，线宽 2，颜色 `ink-800`，圆头。基准为 null 时不画。
- 中心文字：基线 y = 38，水平居中；`rate_new_pct` 保留一位小数，15px / 700，`ink-900`；后接「%」，10px / 600。超过 100% 时文字显示真实值，进度画满。
- `aria-label`：「综合税率 {新}（原 {基准}）」。

### 7.2 订单卡严重度条

- 填充宽度 = `min(rate_new_pct, 100)%`，颜色 = 风险色。
- 标记线（`.metric-bar > b`，2×10px，`ink-800`）位于 `min(rate_baseline_user_pct, 100)%`。

## 8. 关键日期时间轴

SVG `viewBox="0 0 900 120"`，宽度 100%。

1. **点：** 报价日 `order.quote_date`、装船日 `order.load_date`、今天 `as_of`、预计入境日 `entry_date`。值为空的点不画。`status` 为 entered 时，入境点的标签改为「已入境」。
2. **规则边界：** `timing_boundary_date` 不为空时画一条竖向虚线（`warn`，线宽 1.5，`stroke-dasharray: 4 4`，y 从 18 到 84），顶部 12px / 600、`warn` 色文字「规则边界 MM-DD」（y = 12）。
3. **范围：** lo = 所有日期（含规则边界）中最早的减 4 天，hi = 最晚的加 6 天。x = 30 + (日期 − lo) ÷ (hi − lo) × 840。
4. **轴线：** y = 70，从 x = 30 到 870，`ink-200`。lo 到 hi 之间每月 1 日画刻度（y 66–74，`ink-300`），下方 y = 112 处写月份（中文「{n}月」，英文「Jan」…「Dec」），12px `ink-400`。
5. **点样式：** 报价日 r = 3.5、`ink-300`；装船日 r = 3.5、`ink-400`；今天 r = 4.5、`brand`；入境 r = 5、风险色。
6. **标签：** 点按日期排序（同日按第 1 条列出的顺序），排在第 1、3… 位的标签放在轴上方（y = 52），第 2、4… 位放在下方（y = 96）。标签由名称（12px / 600，`ink-700`）和「MM-DD」（`ink-400`）组成，居中对齐。
7. **图例：** 放在 `.chart-head` 右侧 `.legend-row`，顺序固定为：报价日、装船日、今天、规则边界、预计入境日（或「已入境」）；只列出实际画出的项。报价日、装船日、入境用 `.legend-dot.fill`，在圆点上用 `style="color:…"` 设置与点相同的颜色；今天用 `.legend-item.active`；规则边界用 `.legend-item.warn` + `.legend-dot.dashed`。

## 9. 接口与前端行为变更

### 9.1 影响单列表增加字段

`GET /api/impacts` 的列表项增加 `rate_baseline_user_pct`、`rate_new_pct`（数值，与详情接口同名字段相同）。更新 schema 后运行 `npm run gen:api`。

### 9.2 侧栏搜索

- 所有页面都显示侧栏搜索框；Ctrl/⌘+K 聚焦。
- 在 `/inbox`：输入后停止 300ms 即过滤列表（与现在相同），关键词写入 URL `?q=`。
- 在其他页面：按 Enter 跳转到 `/inbox?q={关键词}`。
- `/inbox` 读取 URL 中的 `q` 并填入搜索框。

### 9.3 收件箱标签

`/inbox?tab=urgent` 打开时选中「紧急」；切换分段按钮时同步更新 URL。

### 9.4 前端统计

以下数字由前端从已获取的列表中统计或换算，只用于显示：规则审核筛选行的四个计数（§6.5）、日报标签页计数（§6.3）、今日进度条和日报汇总条形的宽度（§3.2、§6.3）、环形图和严重度条（§7）、时间轴坐标（§8）。

## 10. 删除

- `design/tokens.css` 中的全部类：`brut`、`brut-*`、`btn-press`、`stamp-*`、`grid-paper`、`grid-doc`、`polka`、`stripes-warn`、`label-zh`，以及 `frontend/src/app/workspace.css`。
- 组件：C04 IdCornerTag、C06 ChainDots（卡片上的圆点）、C17 BigStamp、C14 中的印章。
- 依赖：`gsap`、`@gsap/react`、`animejs`。
- `next/font/google` 及其字体夹具（§1.2）。
- 收件箱中的「审计日志」「智能体流水线」区块；工作台右栏概况卡；工作台对话栏的「对话记录」标题；顶栏大标题行；侧栏品牌块。

## 11. 新增文案

| 中文 | 英文 |
|---|---|
| 税则 {hts_release} | HTS {hts_release} |
| 税率 {base} → {new} | Rate {base} → {new} |
| 红色风险 / 橙色风险 / 黄色风险 / 绿色风险 | Red risk / Orange risk / Yellow risk / Green risk |
| 原因：{text} | Reason: {text} |
| 综合税率 {a} → {b}，关税增量 {d}；利润 {p0} → {p1}，毛利率 {m0} → {m1}。 | Combined rate {a} → {b}, duty change {d}; profit {p0} → {p1}, margin {m0} → {m1}. |
| 综合税率 {new}（原 {base}） | Combined rate {new} (was {base}) |
| 报价日 | Quote date |
| 今天 | Today |
| 规则边界 | Rule boundary |
| 规则边界 {MM-DD} | Rule boundary {MM-DD} |
| {n}月 | Jan … Dec |
| 税率分层 | Duty layers |
| 利润（标签页） | Profit |
| 没有不通过项 | No failed checks |
| 没有注意项 | No warnings |
| 没有通过项 | No passed checks |
| 暂无临界事件 | No critical events |
| 暂无处理记录 | No decisions yet |
| {n} 待处理 | {n} pending |
| {n} 红色 | {n} red |
| {n} 紧急 | {n} urgent |
| {n} 临界事件 | {n} critical events |
| 政策日报 {date} | Policy brief {date} |
| 生成于 {MM-DD HH:mm} | Generated {MM-DD HH:mm} |
| 订单汇总 | Order summary |
| 美国关税政策日报 | U.S. Tariff Policy Brief |
| 结论按生成时的订单状态计算，之后的决策和重算不会更新这句话。 | This conclusion reflects order status when the brief was generated. Later decisions and recalculations do not update it. |
| 类型 | Type |
| {类型} · 更新于 {MM-DD HH:mm} | {type} · Updated {MM-DD HH:mm} |
| {n} 待确认 / {n} 需补充 / {n} 已确认 / {n} 已驳回 | {n} to confirm / {n} needs detail / {n} approved / {n} rejected |
| 不适用：{list} | N/A: {list} |
| 受影响订单 | Affected orders |
| 步骤 | Steps |
| 动作 | Action |
| 执行者 | Actor |
| 摘要 | Summary |
| 还没有运行记录 | No runs yet |
| 连接状态 | Connection |
| 连接失败 | Connection failed |

英文已有译名的词（如「临界事件」Critical Events、「待处理」Pending）沿用现有译名；上表与现有译名冲突时，以现有译名为准，并在 `docs/i18n-review.md` 中注明。
