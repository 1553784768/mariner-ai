# TASKS.md

所有期望值都基于以下配置：`AS_OF_DATE=2026-10-31`、`COLLECTOR_MODE=fixture`、`SCHEDULER_ENABLED=false`，且不配置模型（智能体走夹具）。完成一个任务后，把它的状态改为 `DONE（日期）`，并写一行说明。

## M0 仓库

### T-0.1 初始化 — 状态：DONE（2026-10-31）

目录、夹具迁移、Logo、环境变量示例已建立；git check-ignore backend/.env 已命中。

- 按 SPEC §3 建好目录。
- `backend-fixtures/` 改名为 `backend/fixtures/`。
- 把 logo 文件复制到 `frontend/public/`。
- `.gitignore` 加入：`.env`、`.venv/`、`node_modules/`、`backend/data/`、`artifacts/`。
- 写 `backend/.env.example`：列出 SPEC §5 的全部变量，并附测试配置的注释。
- 写 `frontend/.env.example`。
- **验收：** 目录与 SPEC §3 一致；`git check-ignore backend/.env` 命中。

## M1 后端基础

### T-1.1 FastAPI 骨架 — 状态：DONE（2026-10-31）

health、参数错误与来源限制已覆盖测试；ruff 通过。

- `settings.py`（SPEC §5）、CORS、统一错误格式（API §1）、`GET /api/health`。
- **验收：** pytest 覆盖 health 接口和错误格式；`ruff check` 通过。

### T-1.2 引擎移植 — 状态：DONE（2026-10-31）

原引擎、移植引擎和 golden 的 8 单对照通过；O5 分层及时间边界通过。

- 按 SPEC §8 执行。
- **验收：**
  1. 同时导入 `seed/engine/engine.py` 和 `app/engine/core.py`，用 `seed/engine/rules.json` 计算 8 笔种子订单（as_of 2026-10-31，无情景）。两者的原有字段全部相等，结果也与 `seed/golden/impacts.json` 相等，浮点容差 0.01。
  2. O5 的 `layers` 为 MFN 4.4 / SEC301_LIST_CN 25.0 / SEC301_FORCED_LABOR_CN 12.5，对应 `duty_usd` 为 2816.00 / 16000.00 / 8000.00；`timing_boundary_date="2026-11-09"`；`timing_saving_usd=16000.00`。

### T-1.3 数据库与种子 — 状态：DONE（2026-10-31）

SQLAlchemy 实体、种子和快照已实现；数据库路径 golden 对照通过。

- 建 SQLAlchemy 模型：API §4 涉及的全部实体，外加 `RuleVersion`（SPEC §7）、`PolicyDocument`、`TriageRecord`、`AgentStep`、`HtsRelease`、`LlmSettings`。
- 实现种子加载和 `build_snapshot()`。
- **验收：**
  1. `build_snapshot()` 与 `rules.json` 深度相等。
  2. 走数据库路径算出的结果与 `impacts.json` 相等。

## M2 业务接口

### T-2.1 订单导入 — 状态：DONE（2026-10-31）

重复与新增导入、7 类原子校验、批次和审计测试通过。

- **验收：**
  1. 再次上传 `seed/engine/orders_sample.csv`，返回 `imported=0, updated=8`。
  2. 把其中一行改成新的 order_id 后上传，返回 `imported=1`。
  3. 以下每种情况各写一个用例，都返回 422 且库内订单不变：缺列、枚举非法、日期格式错、日期顺序颠倒、`qty=0`、文件内订单号重复、税号不在规则库。
  4. 税号不在规则库时，错误信息列出 6 个已支持的税号。
  5. 导入成功后新建批次，并写审计 `ORDERS_IMPORTED`。

### T-2.2 批次与影响接口 — 状态：DONE（2026-10-31）

计数、排序、筛选、倒计时、分层、观察项及重算验收通过。

- **验收：**
  1. `/api/meta.counts` 为 `{pending:8, red:1, orange:1, yellow:2, green:4, urgent:2, drafts_pending:0, decisions_total:0}`。
  2. `/api/impacts` 返回顺序为 `O5, O1, O3, O6, O4, O2, O8, O7`。
  3. 筛选结果：`incoterm_group=ddp` → `O5, O1, O3, O4, O8, O7`；`non_ddp` → `O6, O2`；`risk=红,橙&decision=pending` → `O5, O6`。
  4. countdown：O5 为 `rule_boundary` 9 天；O1 为 `entry` 18 天；O7 为 `entered`。
  5. O6 的 `baseline_match` 为 `warn`，value 为 `30.3% / 40.3%`。
  6. O8 的 `layers` 只有 MFN 5.3 和 SEC301_LIST_CN 25.0，`flags` 中包含「适用在途豁免 9903.05.85」。
  7. O7 的 `potential_refund_usd` 为 6000.00。
  8. `/api/watch-items` 的结果依次为：
     - `W_301_EXCLUSION_EXPIRY`（红，−16000.00，[O5]）
     - `W_232_ROBOTICS`（黄，null，[O2]）
     - `W_301_EXCESS_CAPACITY`（黄，null，[O1]）
  9. `POST /api/runs` 新建批次，且结果不变。

### T-2.3 决策与审计 — 状态：DONE（2026-10-31）

重复决策、状态沿用和逐条 SHA-256 链复算通过。

- **验收：**
  1. 对 O5 提交 `adopted`：O5 状态更新，审计新增一条 `DECIDED`。
  2. 再对 O5 提交 `needs_detail`：O5 当前状态变为 `needs_detail`，`/api/decisions` 中有 2 条 O5 的记录。
  3. 审计哈希链可以逐条复算（第一条的 prev_hash 为 64 个 0）。
  4. 单元测试 `carry_over_decisions`：O5 结果不变、O1 利润变化改变 → O5 保持原状态，O1 变为 `pending`。
  5. 规则不变时新建批次，所有订单的决策都沿用。

## M3 前端基础

### T-3.1 Next.js 初始化 — 状态：DONE（2026-10-31）

Next.js 16、指定字体、原样 tokens、图标与脚本已配置；生产构建、lint、typecheck 通过，组件页字体已检查。

- 用 create-next-app 创建项目（TypeScript、App Router、ESLint、`src/`、Tailwind）。
- 把 `globals.css` 替换为 `design/tokens.css`。
- 按 SPEC §4 配置字体，按 DESIGN §2 配置 title 和 favicon。
- 加入脚本：`dev`（`next dev -H 127.0.0.1 -p 3000`）、`build`、`lint`、`typecheck`、`gen:api`。
- **验收：** `npm run build` 通过；`/dev/components` 页面能显示三种字体和中文回退的效果。

### T-3.2 组件库 — 状态：PARTIAL / BLOCKED(Q-001)（2026-10-31）

C01–C26、状态展示及金额格式已实现并截图（artifacts/screenshots/T-3.2.png）；仅利润表的卖方成本变化、毛利率变化两格缺少接口定义，显示「待定」。

- 实现 DESIGN §6 中的 C01–C26。
- `/dev/components` 页面需展示：4 种风险等级、5 种圆点状态、3 种印章、加载 / 空 / 错误状态、品牌块。
- 实现 `lib/format.ts`，按 DESIGN §7 的规则格式化。
- **验收：** `formatMoney` 的结果在页面上显示为 `−$16,000.00` 和 `+$1,500.00`；截图。

## M4 收件箱

### T-4.1 外壳 — 状态：DONE（2026-10-31）

品牌、导航计数与选中态通过 E2E；截图 artifacts/screenshots/T-4.1.png。

- 侧栏、顶栏、路由。
- **验收：**
  1. 品牌块显示 logo 和「Mariner AI」。
  2. 导航计数：风险收件箱 8、规则审核 0；模型接入显示「未接入」。
  3. 当前页的导航项为选中态。
  4. 截图。

### T-4.2 队列栏 — 状态：DONE（2026-10-31）

排序、DDP/紧急筛选、O5 金额/倒计时及 URL 选中通过 E2E；搜索、重算与入场动画已实现；截图 artifacts/screenshots/T-4.2.png。

- 标签页（全部 / 紧急）、筛选行、「重新计算」、搜索（Ctrl/⌘+K 聚焦）、影响卡、入场动画。
- 选中卡片时同步更新 URL 的 `?order=`。
- **验收：**
  1. 卡片顺序与 T-2.2 第 2 条一致。
  2. O5 的编号签为 `bad` 底，金额为 `−$16,000.00`，倒计时显示「规则边界 9天」，`paper` 底。
  3. 选「DDP」剩 6 张；切到「紧急」剩 O5、O6。
  4. 截图。

### T-4.3 文档与操作栏 — 状态：PARTIAL / BLOCKED(Q-001)（2026-10-31）

O5 金额、4 条建议、核验提示、Ctrl+Enter 决策通过 E2E；1440/1300 布局及表格无横向溢出已检查，截图 T-4.3-1440.png、T-4.3-1300.png、T-4.3-profits-1440.png、T-4.3-profits-1300.png、T-4.3-adopted.png（均在 artifacts/screenshots/）。仅 Q-001 的两个变化单元格阻塞。

- C07–C12、C17、C22、C23；快捷键；视口 ≤ 1350px 时的布局。
- **验收（选中 O5）：**
  1. 分层表的表尾为：`$10,816.00`、`$26,816.00`、`+$16,000.00`。
  2. 利润表中原利润 `$8,473.57`，重算后 `−$7,526.43`。
  3. 可执行建议共 4 条。
  4. 规则核验中「未核实字段」显示「注意」。
  5. 按 Ctrl+Enter 后盖「已采纳」章，审计新增 `DECIDED`。
  6. 宽度 1440 和 1300 各截一张图。

### T-4.4 详情栏下半部 — 状态：DONE（2026-10-31）

审计、最近处理、流水线和三张临界事件卡已实现；卡片顺序/颜色与机器人文案通过检查；截图 artifacts/screenshots/T-4.4.png。

- C13（最新 6 条）、C14（最新 4 条）、C15、C16。
- **验收：**
  1. 临界事件有 3 张卡，顺序和颜色与 T-2.2 第 8 条一致。
  2. 机器人那张卡显示「影响 1 单 · 暂无税率」。
  3. 截图。

## M5 采集

### T-5.1 联邦公报与公开预览 — 状态：DONE（2026-10-31）

30 篇去重采集、全文、respx 分页/重试/不可用与跨主机拒绝测试通过。

- **验收：**
  1. fixture 模式下：正式文件入库 20 篇，公开预览入库 10 篇；再跑一次，新增 0 篇。
  2. 2026-20511 的全文去掉标签后包含 `8479.90.9591`。
  3. live 模式用 respx 模拟测试翻页、重试、公开预览不可用（用 `public_inspection_unavailable_example.json`），以及拒绝白名单之外的主机。

### T-5.2 USITC — 状态：DONE（2026-10-31）

夹具版本读取与 meta 的 2026HTSRev22 验收通过。

- **验收：** `/api/meta.hts_release` 为 `2026HTSRev22`。

### T-5.3 调度与手动运行 — 状态：DONE（2026-10-31）

每日 07:30 时区、禁用调度和 202/409 并发测试通过。

- **验收：**
  1. 调度任务只有一条：Asia/Shanghai 时区每天 07:30。
  2. `SCHEDULER_ENABLED=false` 时没有调度任务。
  3. `POST /api/pipeline/runs` 返回 202；流水线运行中再次调用返回 409。

## M6 智能体

### T-6.1 模型调用与配置接口 — 状态：DONE（2026-10-31）

23 条结构与引用、HTTP 请求/纠错/重试、掩码保存和连接测试通过。

- 按 AI_PIPELINE §2 实现两种客户端；实现 `/api/settings/llm` 的四个接口。
- **验收：**
  1. `triage.json` 的 23 条都能通过 Pydantic 校验；每条 quote 都能在该文件合并后的元数据中找到。
  2. 用 respx 模拟 OpenAI 兼容接口，检查请求：URL 为 `{base_url}/chat/completions`，带 Bearer 认证，`response_format` 为 `json_object`，不带 `temperature`。
  3. 以下三种情况的处理符合 AI_PIPELINE §2：返回内容不是 JSON、返回 5xx、返回 4xx。
  4. 保存配置后，GET 接口只返回掩码 key；PUT 时不带 `api_key`，原 key 保留。
  5. 测试连接：成功和失败两种情况都有用例。
  6. 修改配置时写审计 `LLM_SETTINGS_CHANGED`。

### T-6.2 分诊 — 状态：DONE（2026-10-31）

23 成功、7 跳过、8 相关验收通过。

- **验收：** 分诊成功 23 篇，跳过 7 篇；其中 `relevant=true` 的有 8 篇。

### T-6.3 抽取与校验 — 状态：DONE（2026-10-31）

2 草稿、V1–V9、4 高亮、无现有税号不写版本、伪造引用拒绝测试通过。

- **验收：**
  1. 符合抽取条件的 8 篇中，生成草稿 2 篇（2026-20511、2026-20510），跳过 6 篇。
  2. 2026-20511 的校验结果：
     - V1、V2 为 pass
     - V3 为 warn（生效日 2026-07-01 早于发布日 2026-10-07 减 30 天）
     - V6 为 warn（无夹具）
     - V4、V5、V7、V8、V9 为 n/a

     确认后不新建规则版本，审计中写明「不影响现有订单」。
  3. 构造一条 quote 在原文中不存在的草稿：V1 为 fail，确认时返回 409。

### T-6.4 日报 — 状态：DONE（2026-10-31）

9 条日报、顺序、确认状态、结论和日期列表验收通过。

- **验收：**
  1. 日报共 9 条，依次为：1 条 expiry（O5，−16000.00）、7 条 policy、1 条 preview_alert（2026-22385）。
  2. 2026-20511 和 2026-20510 两条的 `confirmed` 为 false。
  3. 结论为「今天没有新的已生效税率变化。待处理红色订单 1 单，合计利润变化 −$16,000.00。」
  4. `/api/briefs` 返回 `[{date:"2026-10-31", item_count:9}]`。

### T-6.5 编排 — 状态：DONE（2026-10-31）

完整夹具流水线各步骤计数、partial 及重复执行不重复处理测试通过。

- **验收：** 在 fixture 模式下跑完整流程：各步骤的状态和计数与 AI_PIPELINE §6 中的期望表一致，流水线状态为 `partial`。

## M7 页面

### T-7.1 政策日报页 — 状态：DONE（2026-10-31）

9 条日报与日期选项通过 E2E；截图 artifacts/screenshots/T-7.1.png（截图处于 O5 已处理后的状态）。

- **验收：** 按 DESIGN §9 显示 T-6.4 的 9 条；日期下拉框里有 2026-10-31；截图。

### T-7.2 规则审核页 — 状态：DONE（2026-10-31）

2 草稿、4 高亮、V1–V9、确认后禁用和 RULE_APPROVED 审计通过 E2E；截图 artifacts/screenshots/T-7.2.png、T-7.2-approved.png。

- **验收：**
  1. 页面显示 2 张草稿卡。
  2. 2026-20511 的原文中有 4 处高亮。
  3. 校验面板列出 V1–V9。
  4. 点「确认规则」后：草稿变为 approved，按钮禁用，审计新增 `RULE_APPROVED`。
  5. 截图。

### T-7.3 智能体流水线页 — 状态：DONE（2026-10-31）

新建 e2e.db 上运行、按钮禁用、轮询及 7 步计数通过 E2E；截图 artifacts/screenshots/T-7.3.png。

- **验收：**
  1. 点「立即运行」后按钮禁用。
  2. 在新建的 `e2e.db` 上运行：运行期间每 2 秒刷新一次；结束后步骤表的数字与 AI_PIPELINE §6 的期望表一致。
  3. 截图。

### T-7.4 模型接入页 — 状态：DONE（2026-10-31）

拦截请求覆盖保存、测试成功/失败、清除及侧栏状态；截图 artifacts/screenshots/T-7.4.png、T-7.4-success.png、T-7.4-failed.png。

- **验收：** 用 Playwright 拦截后端请求，覆盖以下操作：保存、测试成功、测试失败、清除；侧栏的「已接入 / 未接入」随之变化；截图。

## M8 收尾

### T-8.1 端到端测试 — 状态：DONE（2026-10-31）

完整业务路径与模型设置两项 Playwright 测试通过，含指定字体加载检查；日志 artifacts/playwright.log，截图复用 T-4.3-adopted、T-7.1、T-7.2-approved、T-7.3。

- **验收：** 用 E2E 库 `e2e.db` 按以下路径操作，全程通过：
  1. 打开收件箱，选中 O5，核对 3 个金额。
  2. 按 Ctrl+Enter 盖章，O5 出现在最近处理中。
  3. 进入流水线页，点「立即运行」。
  4. 进入规则审核页，确认 2026-20511。
  5. 进入政策日报页，看到 9 条。

### T-8.2 启动脚本 — 状态：DONE（2026-10-31）

Windows 独立副本新建 Python 3.12 venv、pip 安装和 npm ci 后，一键启动及浏览器显示 8 单收件箱已验证；截图 artifacts/screenshots/T-8.2.png，日志 artifacts/clean-startup.log。README 已补安装/启动/测试；dev.sh 通过 bash -n，未在 Linux 实机运行。

- 提供 `scripts/dev.ps1`（Windows）和 `scripts/dev.sh`，一条命令同时在 127.0.0.1 启动前后端。
- 根目录 README 增加「安装 / 启动 / 测试」三节。
- **验收：** 在干净环境中，执行脚本后访问 `http://127.0.0.1:3000` 能看到收件箱。
