# AGENTS.md

Mariner AI：把美国关税政策变化换算成每笔订单利润变化的本地 Web 应用。前端 Next.js（`frontend/`），后端 FastAPI（`backend/`），单用户，只在本机运行。

## 文档

- v0.2 改动与任务：`docs/V02_SPEC.md`、`docs/TASKS_V02.md`、`docs/engine_text_templates.json`（当前开发阶段先读这三份）
- v0.1 任务与验收：`docs/TASKS.md`
- 架构、目录、依赖、环境变量、数据流、业务规则：`docs/SPEC.md`
- 视觉、布局、组件、文案、Logo：`docs/DESIGN.md`、`design/tokens.css`、`design/reference/approva-reference.html`、`design/logo/`
- 接口与数据结构：`docs/API.md`
- 智能体、模型调用、校验：`docs/AI_PIPELINE.md`

文档冲突时按此优先级取值：V02_SPEC > SPEC > API > AI_PIPELINE > DESIGN > TASKS_V02 > TASKS，并在回复中注明冲突位置。

## 不确定的事不自主决策

文档没写、且会影响以下任一项的事项，不得自行决定：

- 界面行为、页面、文案、颜色、字体、间距、布局
- 数据字段、API 路径和响应结构
- 计算逻辑、阈值，以及税率、日期等关税事实
- 新依赖、外部服务
- 安全与数据外发

处理步骤：

1. 在 `docs/QUESTIONS.md` 按模板追加 `Q-xxx`。
2. 跳过被阻塞的部分。代码里写 `BLOCKED(Q-xxx)`；界面上需要占位的地方显示「待定」。
3. 继续做其他任务。
4. 最终回复里列出新增的 Q 编号。

以下可以自行决定：内部命名、文件拆分、组件内部结构、测试辅助代码、不改变外部行为的重构、lint 和类型错误修复。

## 约束

- 关税、费用、利润的数字只由 `backend/app/engine/` 计算。大模型不生成、也不修改任何数字：对话中只能照抄知识库里已有的数字（经数字守卫检查）；导入时从文件中抄录的数字，必须经人工预览确认后才能入库。
- 订单数据（客户、价格、成本、数量）不发给大模型或任何外部服务，只有 `docs/V02_SPEC.md` §9 列出的两种经用户同意的情况例外，且都要写审计。
- 不改引擎的计算逻辑，也不改 `rules.json` 中的税率和日期。`seed/golden/impacts.json` 测试必须一直通过。
- 依赖只用 `docs/SPEC.md` §4 白名单中的，以及 `docs/V02_SPEC.md` §9 新增的 `prettier`、`openpyxl`。
- 自动化测试不联网，统一使用 `backend/fixtures/`。
- 前后端都只监听 `127.0.0.1`。

## 授权

**无需询问：**

- 在仓库内创建、修改文件
- 安装白名单内的依赖
- 运行测试、lint、开发服务器
- 用 Playwright 截图
- 创建或删除测试库和 `backend/data/e2e.db`

**必须先问：**

- 安装白名单外的依赖
- 删除或清空 `backend/data/app.db`
- 改写 git 历史

## 命令

```bash
# 后端（Windows 用 py -3.12 -m venv .venv 和 .venv\Scripts\activate）
cd backend && python3.12 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
ruff check . && pytest -q

# 前端
cd frontend && npm install && npx playwright install chromium
npm run dev          # next dev -H 127.0.0.1 -p 3000
npm run gen:api      # openapi-typescript http://127.0.0.1:8000/openapi.json -o src/lib/api-types.ts
npm run lint && npm run typecheck
npx playwright test
```

## 完成定义

- 满足当前阶段任务文件（v0.2 为 `docs/TASKS_V02.md`）中该任务的全部验收标准。
- 按改动所在一侧运行检查：后端 `ruff check` + `pytest`；前端 `lint` + `typecheck`；涉及 E2E 的任务再跑 `playwright`。检查通过后，没有新改动就不重复测试，也不扩大测试范围。
- 界面任务：在 1440×900 下截图，存为 `artifacts/screenshots/<任务ID>.png`；同一任务需要多张时，命名为 `<任务ID>-<宽度或状态>.png`。回复中附上路径。
- 在当前阶段任务文件中把该任务状态改为 `DONE（日期）`，并写一行说明。
- 按 TASKS 的顺序推进。任务被部分阻塞时，先做完其余部分，再继续下一个任务。
- 回复用中文。代码、注释、提交信息用英文。中文界面文案只用 `docs/DESIGN.md`、`docs/API.md`、`docs/V02_SPEC.md` 中写出的字符串；英文文案按 `docs/V02_SPEC.md` §7.6 的术语表翻译，并汇总到 `docs/i18n-review.md`。
