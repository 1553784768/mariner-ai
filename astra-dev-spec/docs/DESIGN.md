v0.3 起视觉以 docs/V03_DESIGN.md 为准；本文件只有 §7、§8 和 §11 的审计动作、合同关税条款显示仍然有效。

# DESIGN.md

视觉参考的源码快照：`design/reference/approva-reference.html`。样式：`design/tokens.css`，复制到 `frontend/src/app/globals.css`。

本文件中用「」或代码格式写出的中文，以及 API.md 中的中文标签，都是已批准的文案；需要新文案时，按 AGENTS.md 的流程提问。

## 1. 设计令牌（数值不得修改）

### 1.1 颜色

| 令牌 | 值 | 用途 |
|---|---|---|
| `canvas` | `#CFE8D6` | 页面底色、侧栏、队列栏、表头 |
| `ink` | `#121210` | 文字、所有边框、所有投影、黑底面板 |
| `paper` | `#FFFFFF` | 卡片、文档、输入框 |
| `ok` | `#2E8C42` | 通过、完成、采纳、风险「绿」 |
| `warn` | `#E8A030` | 待处理、注意、需补充、风险「橙」 |
| `warn-soft` | `#F4D89A` | 斜纹、风险「黄」、原文高亮 |
| `bad` | `#C03A3A` | 不处理、失败、风险「红」 |

次级文字统一用 `ink` 加透明度（0.5 / 0.6 / 0.7），不另设灰色。

### 1.2 字体

| 角色 | 字体栈 | 字重 |
|---|---|---|
| display（标题、按钮、导航） | Archivo → Noto Sans SC | 500–900 |
| sans（正文） | Hanken Grotesk → Noto Sans SC | 400–700 |
| mono（数字、编号、标签、表格） | Space Mono → Noto Sans SC，`tabular-nums` | 400/700 |

### 1.3 字号

| 场景 | 字体 | 字号 | 字重 |
|---|---|---|---|
| 页面标题 h1、文档标题 | display | 30px / 36px | 700 |
| 卡片标题 | display | 20px，`leading-tight` | 700 |
| 区块标题（前置图标） | display | 18px | 700 |
| 导航项 | display | 16px | 600 |
| 正文 | sans | 14px / 12px | 400/600 |
| 微标签 | mono | 10px；拉丁字母字距 0.1em；纯中文标签加 `label-zh` 类（字距 0.04em）；透明度 0.6 | 400 |
| 标签 tag | sans | 11px，大写，字距 0.06em | 600 |
| 卡片金额 / 合计金额 / 侧栏统计数 | mono | 24px / 20px / 30px | 700 |
| 表格（分层表、利润表、步骤表） | mono | 正文 14px；表头 12px、字距 0.1em | 400 / 600 |
| 最近处理表（`.history-table`） | mono | 正文 12px；表头 10px、字距 0.06em | 400 / 600 |

### 1.4 边框、投影、交互

| 类 | 规格 |
|---|---|
| `.brut` | 3px `ink` 边框 + `4px 4px 0` 投影 |
| `.brut-lg` | 3px 边框 + `6px 6px 0` 投影 |
| `.brut-sm` | 2px 边框 + `3px 3px 0` 投影 |
| `.brut-card` | `.brut` + 白底；悬停或选中时 `translate(-2px,-2px)` + `8px 8px 0` |
| `.nav-item` | 悬停或当前页时 `translate(-1px,-1px)` + `5px 5px 0` |
| `.btn-press:active` / `.stamp-btn:active` | `translate(4px,4px)`，投影归零 |
| 分区线 | `3px solid ink`；表格行线 `1px solid rgba(18,18,16,.2)` |
| 圆角 | 一律 0。例外：处理链圆点 999px，印章 4px / 6px |
| 焦点 | `:focus-visible` 时显示 `3px solid ink` 描边，偏移 2px |

### 1.5 背景纹理

| 名称 | 规格 |
|---|---|
| `grid-paper` | 24px 网格，线色 0.08 |
| `grid-doc` | 28px 网格，线色 0.05 |
| `polka` | 20px 圆点 |
| `stripes-warn` | 45° 斜纹，12px `#F4D89A` + 2px `#E8A030` |

### 1.6 动效（GSAP + anime.js v4）

| 动效 | 规格 |
|---|---|
| 卡片入场 | `autoAlpha 0→1, y 24→0, 0.5s, power3.out, stagger 0.06` |
| 文档入场 | `autoAlpha 0→1, y 20→0, 0.6s, power3.out, delay 0.15` |
| 决策按钮入场 | `autoAlpha 0→1, x 30→0, 0.5s, power3.out, stagger 0.08, delay 0.3` |
| 盖章 | 印章：`scale 3→1, rotate −15°→−6°, opacity 0→0.88, 600ms, spring(stiffness 90, damping 8, mass 1.4)`。同时文档抖动：`x: [0,−8,6,−4,2,0], 600ms, outElastic(1, .5)` |
| 减少动效 | 执行 JS 动画前检查 `matchMedia('(prefers-reduced-motion: reduce)')`，为 true 时跳过所有动画，印章直接显示 |

## 2. 品牌

- 产品名：Mariner AI。页面 `<title>`：`Mariner AI`。favicon：`/favicon.png`。
- 侧栏品牌块（C25）：
  - 左侧是 44×44 的 `brut-sm` 白底方框，内放 `/logo.png`，`object-fit: contain`，内边距 3px。
  - 右侧上行是「Mariner AI」，display 字体、18px、700、`leading-none`。
  - 右侧下行是 mono 10px、字距 0.1em、透明度 0.6 的「v0.1 · 税则 {hts_release}」。
- Logo 只在品牌块和 favicon 使用；Logo 的蓝色不进入界面配色。

## 3. 布局（桌面端，最小宽度 1280px）

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ 侧栏 260px │ 顶栏：h1 + 计数标签 + 时间戳 ｜ 搜索框(w-72) + 主按钮         │
│ p-5        ├──────────────────────────────────────────────────────────────┤
│ 品牌块     │ 标签页行（仅收件箱）：全部 · 紧急                              │
│ 导航 ×5    ├──────────────────────┬───────────────────────────────────────┤
│            │ 队列栏 w-[44%] p-5   │ 详情栏 flex-1 p-6，grid-doc 底          │
│            │ 筛选行 + 排序        │ ┌文档 flex-1 brut-lg p-7┐┌操作栏 w-44┐ │
│ 今日进度卡 │ 影响卡 × N           │ │ 订单影响单            ││ 决策 ×3   │ │
│ 用户块     │ (space-y-4)          │ │                        ││ 规则核验  │ │
│            │                      │ └────────────────────────┘└sticky top-6┘│
│            │                      │ 审计日志（黑底）                        │
│            │                      │ 最近处理（表格 + 印章）                 │
│            │                      │ 智能体流水线（polka 底）                │
│            │                      │ 临界事件（斜纹外框，3 列）              │
└────────────┴──────────────────────┴───────────────────────────────────────┘
```

视口宽度 ≤ 1350px 时：

- 文档与操作栏改为上下排列。
- 操作栏改为三列网格，规则核验面板占满整行。
- `stamp-btn` 的内边距改为 `14px 6px`，字号改为 12px。

## 4. 收件箱元素

| 位置 | 内容 | 数据 |
|---|---|---|
| 导航 | 风险收件箱（黑底计数 = `pending`）· 政策日报 · 规则审核（黑底计数 = `drafts_pending`）· 智能体流水线 · 模型接入（mono 小字：「已接入」或「未接入」，透明度 0.6） | `/api/meta` |
| 今日进度卡 | 「今日已处理」；大号数字 `today.processed`，旁边「/ {today.total} 单」；下方三色条按 adopted / dismissed / needs_detail 占 total 的比例显示：绿 = 采纳，红 = 不处理，琥珀 = 需补充 | `/api/meta` |
| 用户块 | 首字母方块「本」+「本地用户」，不加载外部图片 | 静态 |
| 顶栏 | h1「订单风险收件箱」+ 白底标签「{pending} 待处理」+ 红底标签「{red} 红色」；下方一行 mono「北京时间 YYYY-MM-DD HH:mm · 计算批次 {run_id}」 | `/api/meta` |
| 搜索框 | 占位文字「搜索订单号、品名、HS 编码…」，快捷键提示（Windows 显示 `Ctrl K`，macOS 显示 `⌘K`）；停止输入 300ms 后请求 | `/api/impacts?q=` |
| 主按钮 | 「+ 导入订单」，点击打开导入对话框 | `POST /api/orders/import` |
| 标签页 | 「全部」/「紧急」，紧急 = 风险为红或橙、且待处理 | `/api/impacts?risk=红,橙&decision=pending` |
| 筛选行 | 全部 · DDP · 非 DDP；右侧「排序：预计入境 最近优先 ↓」；队列栏顶部右侧 `PrimaryButton`「重新计算」 | `incoterm_group`；`POST /api/runs` |
| 影响卡 C05 | 见下方说明 | `ImpactCard` |
| 文档 C07 头部 | 标题「订单影响单」，副行 mono「{order_id} · 规则快照 {as_of} · {run_id}」；右上显示「进口商：卖方（DDP）」或「进口商：买方（{incoterm}）」 | `ImpactDetail` |
| 三栏 C08 | 「品名与税号」：品名 + HTS；「贸易术语」：贸易术语 + 渠道 + 合同关税条款；「关键日期」：装船日 + 预计入境日 | 同上 |
| 税率分层表 C09 | 列：层 / 第99章税号 / 税率 / 关税额。表尾三行：基准关税（填写 x%）、新关税、关税增量（20px 加粗） | `layers` |
| 利润表 C23 | 行：收入 / 卖方成本 / 利润 / 毛利率；列：基准 / 重算 / 变化。收入行的变化列显示「—」 | `revenue_usd` 等 |
| 可执行建议 C22 | 每条建议是一个 `brut-sm` 白底块：左侧 mono 序号 `01`，右侧 14px 正文 | `actions` |
| 处理链 C10 | 节点依次为：政策采集 → 分诊 → 抽取 → 计算引擎 → 你；状态与显示规则见 API.md §6 | `agent_chain` |
| 操作栏 | 标签「决策」；C11 按钮 ×3：采纳建议（`ok`，Ctrl/⌘+Enter）、不处理（`bad`，Ctrl/⌘+Backspace）、需补充（`warn`，Ctrl/⌘+D）；下方 C12「规则核验」 | `POST .../decision`；`checks` |
| 审计日志 C13 | 黑底面板；标题「审计日志」，右上「不可篡改 · SHA-256 链式」；显示最新 6 行 | `/api/audit?limit=6` |
| 最近处理 C14 | 列：订单号 / 品名 / 利润变化 / 处理人 / 时间 / 状态印章；显示最新 4 条 | `/api/decisions?limit=4` |
| 智能体流水线 C15 | 9 个节点：触发 → 采集 → 分诊 → 抽取 → 校验 → 人工确认 → 计算 → 日报 → 完成；只读；状态来源见 API.md §6 | `/api/pipeline/runs/latest`、`/api/meta` |
| 临界事件 C16 | `stripes-warn` 外框，内为 3 列卡片。每张卡显示：中文标题、「影响 {n} 单 · {金额}」、severity 标签；卡片边框用 severity 色 | `/api/watch-items` |
| 盖章 C17 | 决策后在文档右上盖章：「已采纳」（ok）/「不处理」（bad）/「需补充」（warn） | — |

**影响卡 C05：**

| 位置 | 内容 |
|---|---|
| 左上编号签 | 订单号，底色取风险色（§5） |
| 标题 | 品名 |
| 副标题 | `HTS {hts10} · {incoterm} · 预计入境 {MM-DD}` |
| 右侧 | 利润变化（带正负号）；下方小字「利润变化 · USD」 |
| 标签 | 风险等级、贸易术语、倒计时标签、「利好」（有时才显示） |
| 左下 | 28px 方块（2px 黑边、`canvas` 底、mono 字母：b2b 为「B」，ecom 为「E」）；旁边两行文字：「B2B」或「电商」，mono 10px「进口商 卖方」或「进口商 买方」 |
| 右下 | 处理链圆点 C06 |

**倒计时标签：**

| countdown | 文字 | 底色 |
|---|---|---|
| entry | 入境 {n}天 | n ≤ 7 用 `warn`，其余用 `paper` |
| entry 且 n < 0 | 已过入境日 | `bad` |
| rule_boundary | 规则边界 {n}天 | n ≤ 7 用 `warn`，n < 0 用 `bad`，其余用 `paper` |
| entered | 已入境 | `paper` |

## 5. 状态配色

| 状态 | 背景 | 文字 |
|---|---|---|
| 风险 红 | `bad` | `paper` |
| 风险 橙 | `warn` | `ink` |
| 风险 黄 | `warn-soft` | `ink` |
| 风险 绿 | `ok` | `paper` |
| 利好标签 | `paper` | `ok` |
| 圆点 `done` | `ok` | 「✓」 |
| 圆点 `warn` | `warn` | 「!」 |
| 圆点 `pending` | `warn` | 「人」 |
| 圆点 `needs_detail` | `warn` | 「?」 |
| 圆点 `todo` | `paper`，透明度 0.5 | 「·」 |

## 6. 组件

| 编号 | 组件 | 说明 |
|---|---|---|
| C01 | `SidebarNavItem` | 当前页显示 hover 态 |
| C02 | `CountBadge` | |
| C03 | `Tag` | |
| C04 | `IdCornerTag` | |
| C05 | `ImpactCard` | 选中时显示 hover 态，同步写入 URL `?order=` |
| C06 | `ChainDots` | |
| C07 | `ImpactDocument` | |
| C08 | `KeyValueGrid` | |
| C09 | `LayerTable` | |
| C10 | `ProcessChain` | |
| C11 | `StampButton` | |
| C12 | `RuleCheckPanel` | |
| C13 | `AuditLog` | |
| C14 | `DecisionHistoryTable` | 含 `Stamp`，印章分别旋转 −2° 或 2° |
| C15 | `PipelineFlow` | |
| C16 | `CriticalEventsPanel` | |
| C17 | `BigStamp` | |
| C18 | `SearchBox` | |
| C19 | `PrimaryButton` | 黑底白字 `brut` + `btn-press` |
| C20 | `Tabs` | |
| C21 | `SidebarStatCard` | |
| C22 | `ActionList` | |
| C23 | `ProfitTable` | |
| C24 | 状态面板 | `ErrorBanner`：`brut` + `bad` 底 + 白字；`LoadingPanel`：`grid-paper` 底 +「加载中…」；`EmptyPanel`：2px 虚线 `ink/40` 边框 + 说明文字 |
| C25 | `BrandBlock` | 见 §2 |
| C26 | `TextField` | 标签用 mono 10px；输入框为 `brut-sm` 白底，内边距 8px 12px，14px |

## 7. 格式

- **金额：** `$` + 千分位 + 两位小数。变化值带符号，负号用 U+2212，例如 `+$1,500.00`、`−$16,000.00`。
- **百分比：** 一位小数，例如 `40.9%`；百分点写作 `−6.2pp`。
- **日期：** `YYYY-MM-DD`，卡片上用 `MM-DD`。
- **时间：** 一律显示北京时间。

## 8. 文案

| 位置 | 文案 |
|---|---|
| 导航 | 风险收件箱 · 政策日报 · 规则审核 · 智能体流水线 · 模型接入 |
| 侧栏 | 工作区 · 今日已处理 · / {n} 单 · 本地用户 |
| 处理状态 | 待处理 · 已采纳 · 不处理 · 需补充 |
| 规则核验 | 规则已人工确认 · 原文引用命中 · 税号存在 · 基准税率一致 · 未核实字段；状态：通过 · 注意 · 不通过 |
| 处理链节点 | 政策采集 · 分诊 · 抽取 · 计算引擎 · 你（待决定）· 报关行复核（含未核实字段时） |
| 区块标题 | 可执行建议 · 处理链 · 审计日志 · 最近处理 · 智能体流水线 · 临界事件 · 决策 |
| 临界事件（无金额） | 影响 {n} 单 · 暂无税率；n = 0 时显示「暂无受影响订单」 |
| 导入对话框 | 导入订单 CSV · 选择文件 · 上传 · 取消 · 已导入 {a} 行，更新 {b} 行 · 文件未导入，请修正以下错误 · 第 {row} 行 · {field} · {message} |
| 空状态 | 暂无订单，请先导入 CSV · 暂无待确认的规则草稿 · 还没有日报 |
| 通用 | 加载中… · 重试 · 待定 · 重新计算 |
| 免责声明（文档底部小字） | 本工具不构成法律或报关意见；税号归类与最终税额以进口商/报关行申报为准。 |
| 法律状态 | 已生效 · 已签署待生效 · 按期到期 · 拟议 · 调查中 · 谈判中（无税率）· 法院裁决 · 程序性 · 待读全文（值为 null 时） |
| 日报条目类型 | 政策 · 到期 · 观察 · 预警（尚未正式发布） |
| 草稿状态 | 待确认 · 需补充 · 已确认 · 已驳回 |
| 变更类型 | 新增措施 · 修改措施 · 修改税号规则 · 观察项 · 无税率变化 |
| 校验项 | V1 原文引用逐字命中 · V2 字段均有引用 · V3 日期合理 · V4 税率范围 · V5 第99章税号存在 · V6 目标税号存在 · V7 与已确认规则冲突 · V8 新增措施字段完整 · V9 排除到期日必填 |
| 智能体 | 联邦公报采集 · 公开预览采集 · 税则版本检查 · 分诊 · 抽取 · 校验 · 日报 |
| 步骤状态 | 等待 · 运行中 · 完成 · 失败 · 无夹具跳过 |
| 流水线状态 | 运行中 · 完成 · 部分完成 · 失败 |
| 触发方式 | 每日 07:30 · 手动 |
| 审核操作 | 确认规则 · 驳回 · 需补充 · 校验结果 · 预估影响 · 原文 |
| 流水线页 | 立即运行 · 智能体 · 状态 · 输入 · 输出 · 跳过 · 错误 · 耗时 |
| 日报页 | 日期 · 待确认 · 原文标题：{original_title} · 受影响订单 · 原文 |
| 模型接入页 | 模型接入 · 已接入 · 未接入（使用内置夹具）· 接口地址 · API Key · 模型名称 · 保存 · 测试连接 · 清除配置 · 已保存 {masked}，留空则不修改 · 连接成功 · {n} ms · 连接失败：{message} · 接口需兼容 OpenAI Chat Completions 格式（POST {接口地址}/chat/completions）。未配置时，智能体使用内置夹具。 · 例如 https://api.example.com/v1 · 填写服务商提供的模型 ID |
| 错误信息 | 原样显示接口返回的 `error.message` |

## 9. 其他页面（与收件箱共用侧栏和顶栏；没有标签页行）

| 页面 | h1 | 内容 |
|---|---|---|
| `/brief` | 政策日报 | 单栏，`grid-doc` 底，内容最大宽 960px、居中。顶部为 `brut-sm` 白底的日期下拉框（选项来自 `/api/briefs`，默认最新一天）。下方为 `brut-lg` 白底文档：<br>1. 标题「美国关税政策日报 · {date}」<br>2. 结论段（display 18px 700）<br>3. 条目列表，每条依次为：法律状态标签、条目类型标签、标题、副行「原文标题：…」（如有）、摘要、受影响订单号、mono「原文」链接；未确认的条目加白底标签「待确认」<br>4. 底部用 C08 显示订单汇总 |
| `/review` | 规则审核 | 两栏布局，与收件箱相同。<br>**队列：** 草稿卡（复用 C05 结构）。编号签放文件号，标题放分诊的 one_line_zh，金额位放预估影响金额，标签放法律状态、变更类型和草稿状态。<br>**文档区：** 原文全文（mono 12px），evidence 区间用 `warn-soft` 底色高亮。<br>**操作栏：** C11 ×3：确认规则（ok）、驳回（bad）、需补充（warn）；下方放「校验结果」面板（C12 样式，列出 V1–V9）。草稿状态为 approved 或 rejected 时，三个按钮禁用。<br>**排序：** 先按状态（draft → needs_detail → approved → rejected），同状态按 created_at 倒序。<br>**金额位：** 有 impact_preview 时显示 `profit_delta_usd`，副行「预估影响 · USD」；没有时显示「—」 |
| `/pipeline` | 智能体流水线 | 顶栏右侧放 C19「立即运行」，运行中时禁用。<br>**上：** 大号 C15。<br>**中：** 步骤表（C14 表格样式），7 列：智能体 / 状态 / 输入 / 输出 / 跳过 / 错误 / 耗时。<br>**下：** C13 显示最新 20 条审计。<br>运行中每 2 秒刷新一次。 |
| `/settings` | 模型接入 | 单栏，`grid-doc` 底，内容最大宽 720px。`brut-lg` 白底文档：<br>1. 状态标签：已接入为 `ok` 底，未接入为 `warn-soft` 底<br>2. 三个 C26 输入框：接口地址、API Key（password 类型）、模型名称<br>3. 按钮：C19「保存」、`brut-sm` 白底「测试连接」、`brut-sm` 白底红字「清除配置」<br>4. 测试结果行：成功用 `ok` 色字，失败用 `bad` 色字<br>5. 底部说明文字：「接口需兼容 OpenAI Chat Completions 格式（POST {接口地址}/chat/completions）。未配置时，智能体使用内置夹具。」 |

## 10. 图标（`@tabler/icons-react`）

| 位置 | 图标 |
|---|---|
| 导航：风险收件箱 / 政策日报 / 规则审核 / 智能体流水线 / 模型接入 | `IconInbox` / `IconNews` / `IconFileSearch` / `IconGitMerge` / `IconPlugConnected` |
| 搜索框 / 倒计时 | `IconSearch` / `IconClock` |
| 决策：采纳 / 不处理 / 需补充 | `IconCheck` / `IconX` / `IconInfoCircle` |
| 区块：审计日志 / 最近处理 / 流水线 / 临界事件 / 建议 / 规则核验 | `IconListDetails` / `IconArchive` / `IconGitMerge` / `IconAlertTriangle` / `IconBulb` / `IconShieldCheck` |
| 处理链箭头 / 利好 | `IconArrowNarrowRight` / `IconTrendingUp` |
| 临界事件卡：红 / 其他 | `IconFlame` / `IconAlertTriangle` |

## 11. 补充规则

**顶栏（非收件箱页）：**

- 左侧：h1，下方为时间行。
- 右侧：只放 §9 为该页规定的按钮（流水线页是「立即运行」）；没有规定的页面留空。
- 搜索框和「+ 导入订单」只出现在收件箱。

**收件箱默认选中：**

- URL 中有 `?order=` 时，选中该订单。
- 否则选中列表中的第一张卡片。
- 列表为空时，详情栏显示 C24 空状态「暂无订单，请先导入 CSV」。

**标签配色：**

| 标签 | 配色 |
|---|---|
| 法律状态、变更类型 | `paper` 底 |
| 日报条目类型 | `canvas` 底 |
| 草稿状态 | 待确认：`warn-soft` 底；需补充：`warn` 底；已确认：`ok` 底白字；已驳回：`bad` 底白字 |
| 步骤状态 | 等待：`paper` 底、透明度 0.5；运行中：`warn` 底；完成：`ok` 底白字；失败：`bad` 底白字；无夹具跳过：`warn-soft` 底 |
| 流水线状态 | 运行中：`warn` 底；完成：`ok` 底白字；部分完成：`warn-soft` 底；失败：`bad` 底白字 |

**C15 节点底色：**

- 采集、分诊、抽取、校验、日报、完成：与步骤状态或流水线状态的配色相同。
- 触发：`canvas` 底。
- 计算：`ok` 底白字。
- 人工确认：见 API.md §6。

**校验状态：**

| 状态 | 文案 | 文字色 |
|---|---|---|
| pass | 「通过」 | `ok` |
| warn | 「注意」 | `warn` |
| fail | 「不通过」 | `bad` |
| n/a | 「不适用」 | `ink`，透明度 0.5 |

**日报订单汇总（C08）标签：** 订单总数 · 红 · 橙 · 黄 · 绿 · 合计利润变化 · 潜在退款。

**审计行（C13）：**

- 格式：`YYYY-MM-DD HH:mm:ss  {动作}  {执行者}  {摘要}`，北京时间，字段间两个空格。
- 动作中文：

| action | 中文 |
|---|---|
| ORDERS_IMPORTED | 导入 |
| RUN_CREATED | 重算 |
| COLLECTED | 采集 |
| TRIAGED | 分诊 |
| EXTRACTED | 抽取 |
| VALIDATED | 校验 |
| RULE_APPROVED | 确认规则 |
| RULE_REJECTED | 驳回规则 |
| RULE_NEEDS_DETAIL | 规则需补充 |
| BRIEF_PUBLISHED | 日报 |
| DECIDED | 决策 |
| LLM_SETTINGS_CHANGED | 模型配置 |

**合同关税条款显示：** `none` →「无关税条款」；`share:x` →「关税增量我方承担 {x×100}%」。
