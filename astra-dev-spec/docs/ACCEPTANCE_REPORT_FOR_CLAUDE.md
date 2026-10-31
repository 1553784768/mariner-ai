# Mariner AI：交给 Claude 的验收与交接报告

日期：2026-10-31（Asia/Shanghai）
项目目录：`C:\Users\15537\Documents\ChatGPT\三城黑客松\astra-dev-spec`

## 1. 结论与范围

已按 AGENTS.md 和 docs/TASKS.md 推进至 M8：27 个任务中，25 个标记 DONE，2 个标记 PARTIAL / BLOCKED(Q-001)。不能据此声称 M0–M8 全部无条件完成。

实现包括 FastAPI / SQLite 后端、确定性订单计算、导入与批次、决策和哈希审计、政策采集、模型配置、分诊/抽取/校验/日报流水线，以及 Next.js 收件箱、规则审核、日报、流水线和模型接入页面。前端依据指定 Approva 参考与项目 DESIGN/tokens 实现。

本报告区分三类证据：上一轮开发验收结果、本次启动核验、尚未实测的范围。自动测试通过不等于对所有安全性质和所有输入完成穷尽证明。

## 2. 逐里程碑结果

| 里程碑 | 任务状态 | 截图（相对于项目根目录） | 新增问题 |
|---|---|---|---|
| M0 | T-0.1 DONE：目录、忽略规则、环境变量示例 | 无界面任务 | 无 |
| M1 | T-1.1–1.3 DONE：服务骨架、引擎移植、数据库和种子 | 无界面任务 | 无 |
| M2 | T-2.1–2.3 DONE：导入、影响查询、决策和审计 | 无界面任务 | 无 |
| M3 | T-3.1 DONE；T-3.2 除 Q-001 两格外完成 | artifacts/screenshots/T-3.2.png | Q-001 |
| M4 | T-4.1、4.2、4.4 DONE；T-4.3 除同两格外完成 | artifacts/screenshots/T-4.1.png、T-4.2.png、T-4.3-1440.png、T-4.3-1300.png、T-4.3-profits-1440.png、T-4.3-profits-1300.png、T-4.3-adopted.png、T-4.4.png | 无；引用 Q-001 |
| M5 | T-5.1–5.3 DONE：FR/公开预览、USITC、调度及手动运行 | 无独立界面任务 | 无 |
| M6 | T-6.1–6.5 DONE：模型配置、分诊、抽取校验、日报、编排 | 无独立界面任务 | 无 |
| M7 | T-7.1–7.4 DONE：四个业务页面 | artifacts/screenshots/T-7.1.png、T-7.2.png、T-7.2-approved.png、T-7.3.png、T-7.4.png、T-7.4-success.png、T-7.4-failed.png | 无 |
| M8 | T-8.1–8.2 DONE：E2E、启动脚本、安装/启动/测试文档 | artifacts/screenshots/T-8.2.png；完整流程复用 M4/M7 截图 | 无 |

## 3. 上一轮开发验收证据

| 检查 | 结果 | 可复查位置 |
|---|---|---|
| 后端 Ruff | 通过 | backend/pyproject.toml 与 backend/app/、backend/tests/；终端执行结果 |
| 后端 pytest | 19 passed | backend/tests/；上一轮终端执行结果，未保存独立 pytest 日志 |
| 前端 ESLint | 通过 | frontend/package.json 中 lint；终端执行结果 |
| TypeScript | 通过 | frontend/package.json 中 typecheck；终端执行结果 |
| 生产构建 | 通过 | artifacts/production-build.log |
| Playwright | 2 passed，27.2 秒 | artifacts/playwright.log、frontend/e2e/workflow.spec.ts |
| Windows 干净副本安装/启动 | 新建 Python 3.12 venv、pip 安装、npm ci 后启动成功；浏览器显示 8 单 | artifacts/clean-python-install.log、clean-node-install.log、clean-startup.log、screenshots/T-8.2.png |
| Linux 启动脚本 | bash -n 通过 | scripts/dev.sh；未在 Linux 实机运行 |
| 固定资源一致性 | seed 下 4 个原始文件及 design/tokens.css 与用户 ZIP 逐字节一致；globals.css 与 tokens.css 一致 | seed/engine/engine.py、orders_sample.csv、rules.json、seed/golden/impacts.json、design/tokens.css |

后端用例覆盖原引擎/移植引擎/golden 的 8 单对照、导入原子校验、排序筛选、决策沿用、并发审计链、完整 fixture 流水线，以及使用 respx 模拟的 HTTP 重试与模型请求。完整业务 E2E 覆盖选中 O5、核对金额、Ctrl+Enter 决策、运行流水线、确认草稿、查看 9 条日报；另一项 E2E 拦截模型设置请求，验证保存/连接成功/连接失败/清除。

关键对照值：O5 基准关税 $10,816.00、新关税 $26,816.00、增量 +$16,000.00；原利润 $8,473.57、重算利润 −$7,526.43。初始订单顺序 O5、O1、O3、O6、O4、O2、O8、O7。

完整 fixture 流水线的输入/输出/跳过/错误依次为：

| 步骤 | 输入 | 输出 | 跳过 | 错误 |
|---|---:|---:|---:|---:|
| 联邦公报 | 20 | 20 | 0 | 0 |
| 公开预览 | 108 | 10 | 0 | 0 |
| USITC | 1 | 1 | 0 | 0 |
| 分诊 | 30 | 23 | 7 | 0 |
| 抽取 | 8 | 2 | 6 | 0 |
| 校验 | 2 | 2 | 0 | 0 |
| 日报 | 1 | 1 | 0 | 0 |

总体状态 partial 符合 AI_PIPELINE.md 的夹具期望，不代表运行异常。生成 2 张草稿、9 条日报。

截图是不同操作阶段的快照：例如 T-7.1 在 O5 已采纳后生成，待处理红单数与未操作的初始状态不同，不能把跨阶段计数直接比较。

## 4. 唯一开放问题 Q-001

来源：docs/QUESTIONS.md。DESIGN 要求利润表显示卖方成本变化、毛利率变化；API 的 ImpactDetail 无对应字段，SPEC 又限制 evaluate 新增字段，AGENTS 禁止前端计算经济数字。

- 当前行为：两格显示「待定」，frontend/src/components/ui.tsx 留有 BLOCKED(Q-001)。
- 受影响任务：T-3.2、T-4.3；其他金额直接使用现有接口字段。
- 待用户决定的 A 方案：允许引擎适配层计算并扩展 seller_cost_delta_usd、margin_delta_pp 两个 API 字段。
- 待用户决定的 B 方案：批准两格统一显示「—」，不扩展接口。
- Claude 不应把本报告视为对任一方案的批准，也不应自行补算或关闭 Q-001。

## 5. 已知边界与实现说明

- 关税规则是随项目提供的演示快照；测试没有独立核实真实世界关税事实。
- 外部采集与模型 HTTP 分支使用离线模拟验收；未使用真实 API Key 做第三方模型或线上政策端到端联调。
- 自动化测试使用临时数据库或可重建的 e2e.db。app.db 未被删除或清空。
- 指定字体由 next/font/google 的成功生产构建下载，缓存原始 WOFF2 到 backend/fixtures/fonts/。fixture 启动与 E2E 通过 Next 测试 hook 加载内嵌原始字节的 CSS；普通构建保留正常 Google 字体加载。sha256.json 记录缓存哈希。该 hook 属于框架内部机制，升级 Next 时应复核。
- 早期截图曾发现回退字体；修复后已重新运行 E2E 并覆盖截图，加入字体加载错误检查。1440/1300 的表格边界检查通过。
- 所有直接依赖已锁版本；本机使用 Python 3.12.14 与 Next.js 16.4.3。
- artifacts、数据库、依赖和构建目录已忽略。为版本交付复制的截图与已保存日志位于 docs/acceptance/，可随 Git 提交；正文中的 artifacts 路径是原始本机证据位置。版本号见根目录 VERSION，发布范围见 docs/RELEASE_NOTES.md。

## 6. 本次启动与复现

访问入口：http://127.0.0.1:3000/inbox
后端健康接口：http://127.0.0.1:8000/api/health

本次通过 scripts/dev.ps1 -Fixture 后台启动，显式使用 DATABASE_URL=sqlite:///./data/claude-acceptance.db。固定 AS_OF_DATE=2026-10-31、COLLECTOR_MODE=fixture、SCHEDULER_ENABLED=false；验收库未配置模型。启动器 PID 记录在 artifacts/acceptance-launch.pid，日志为 artifacts/acceptance-launch*.log 和 artifacts/frontend*.log、backend*.log。

2026-10-31 16:19（北京时间）实际核验：health 返回 ok、/inbox 返回 HTTP 200；初始计数 pending=8、red=1、orange=1、yellow=2、green=4、urgent=2、drafts_pending=0、decisions_total=0，llm_configured=false。两个监听地址均为 127.0.0.1。证据：artifacts/acceptance-startup-check.json。

浏览器进一步确认：收件箱渲染 8 张订单卡，O5 详情表已加载，document.fonts 中错误项为 0；本次截图为 artifacts/screenshots/CLAUDE-acceptance-startup.png。

本次新增启动修复：后台 PowerShell 从 Node 标准输出读取含中文的字体夹具路径时，前端出现模块路径错误并返回 500。清理可重建缓存未解决；修改 scripts/dev.ps1，改为 Join-Path 直接构造环境变量路径，并检查夹具准备命令退出码后，后台启动成功。此改动仅涉及启动脚本，已通过实际后台启动和页面访问验证；未重复执行无改动的业务测试。旧构建缓存保存在忽略目录 artifacts/next-before-acceptance/。

复现相同启动配置（先停止已运行的验收服务，避免端口冲突）：

```powershell
Set-Location 'C:\Users\15537\Documents\ChatGPT\三城黑客松\astra-dev-spec'
$env:DATABASE_URL = 'sqlite:///./data/claude-acceptance.db'
./scripts/dev.ps1 -Fixture
```

可先检查初始 8 单和 O5 金额，再到「智能体流水线」点击「立即运行」，生成规则审核草稿及日报。本次启动不预先替用户做决策或确认规则。

完整测试命令见 README.md。运行 Playwright 前须停止当前 3000/8000 服务，Playwright 会自行启动并重建专用 e2e.db。不能对 app.db 使用测试清库流程。

## 7. 给 Claude 的复核建议

请先阅读根目录 AGENTS.md 与 docs/TASKS.md，再按 SPEC > API > AI_PIPELINE > DESIGN > TASKS 对照源代码和验收证据。重点检查 Q-001 的边界、订单数据不外发、经济数字集中在 engine、规则审核到版本/重算的行为、审计链和真实服务异常处理。本报告是实现方的交接材料，不是独立第三方审计意见；若复核发现新增缺口，请按 AGENTS 的流程记录，勿把已有 DONE 状态当作无需检查的事实。
