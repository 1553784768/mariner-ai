# SPEC.md

## 1. 范围（最小实施）

本地单用户 Web 应用 Mariner AI：

1. 导入订单 CSV，用确定性引擎算出每单的重算利润、关税增量、利润变化、风险等级和可执行建议。
2. 每天 07:30（北京时间）自动采集美国联邦公报、公开预览和 USITC 税则版本。由分诊、抽取两个大模型智能体生成规则草稿，再经确定性校验。人工在「规则审核」页确认后，草稿写入规则库，并自动重算全部订单。
3. 在站内生成和查看政策日报，可按日期查阅历史日报。
4. 在「模型接入」页配置大模型 API。未配置时，智能体使用 `backend/fixtures/llm/` 的固定输出。
5. 订单处理：采纳建议 / 不处理 / 需补充，每次操作都写入审计日志。

**不做：**

- 多用户和登录
- 部署到服务器
- 推送通知
- 移动端
- 情景模拟与历史回放
- 反倾销/反补贴税、从量税、232 金属含量计算
- 非中国原产地
- 订单来源 ERP 对接（只支持 CSV）

## 2. 架构

```
浏览器 (Next.js, 127.0.0.1:3000)
   │ REST(JSON)；流水线运行中每 2 秒轮询状态
   ▼
FastAPI (127.0.0.1:8000)
   ├─ api/         路由（参数校验、序列化）
   ├─ pipeline/    编排：采集 → 分诊 → 抽取 → 校验 → 日报
   ├─ collectors/  联邦公报、公开预览、USITC（确定性，httpx）
   ├─ agents/      llm_client（OpenAI 兼容接口 / 夹具）、triage、extract、validate、brief
   ├─ engine/      计算引擎（从 seed 原样移植）+ 适配层
   ├─ audit/       SHA-256 链式审计
   ├─ scheduler.py APScheduler：每天 07:30（Asia/Shanghai）运行流水线
   └─ db/          SQLite + SQLAlchemy 2.x（启动时 create_all，无迁移工具）
```

## 3. 目录

```
/AGENTS.md  /README.md
/docs/       SPEC, DESIGN, API, AI_PIPELINE, TASKS, QUESTIONS
/design/     tokens.css, reference/approva-reference.html, logo/
/seed/engine/  engine.py, rules.json, orders_sample.csv   （只读）
/seed/golden/  impacts.json                                （只读）
/backend/
  requirements.txt, requirements-dev.txt, pyproject.toml, .env.example
  app/ main.py, settings.py, scheduler.py
       db/ engine/ collectors/ agents/(prompts/) pipeline/ audit/ api/
  fixtures/   （由规格包的 backend-fixtures/ 改名而来）
  tests/
/frontend/
  package.json, next.config.ts, postcss.config.mjs, tsconfig.json, playwright.config.ts, .env.example
  public/   logo.png, favicon.png
  src/app/  layout.tsx, globals.css, page.tsx, inbox/, brief/, review/, pipeline/, settings/, dev/components/
  src/components/   C01–C26（见 DESIGN.md §6）
  src/lib/  api.ts, api-types.ts（生成）, format.ts, platform.ts, labels.ts
  e2e/
/artifacts/screenshots/
```

**路由：**

| 路径 | 页面 |
|---|---|
| `/` | 重定向到 `/inbox` |
| `/inbox` | 风险收件箱 |
| `/brief` | 政策日报 |
| `/review` | 规则审核 |
| `/pipeline` | 智能体流水线 |
| `/settings` | 模型接入 |
| `/dev/components` | 组件展示，仅开发环境可见 |

**Logo 文件：**

| 规格包中的文件 | 放到 |
|---|---|
| `design/logo/mariner-ai-logo.png` | `frontend/public/logo.png` |
| `design/logo/favicon-64.png` | `frontend/public/favicon.png` |

`design/logo/` 中的 `mariner-ai-logo-original.png` 和 `mariner-ai-icon-512.png` 两个文件不用。

## 4. 依赖白名单

装每个包当时的最新稳定版，并把版本锁定在 `package-lock.json` 和 `requirements*.txt` 里。表中写了主版本号的，必须用该主版本。

| 侧 | 运行时 | 开发 |
|---|---|---|
| 前端 | `next`@16、`react`/`react-dom`（Next 16 要求的版本）、`@tanstack/react-query`@5、`@tabler/icons-react`、`gsap`@3、`@gsap/react`、`animejs`@4 | `typescript`@5、`tailwindcss`@4、`@tailwindcss/postcss`@4、create-next-app 生成的 eslint 相关包和 `@types/*`、`openapi-typescript`、`@playwright/test` |
| 后端 | `fastapi`、`uvicorn[standard]`、`pydantic`@2、`pydantic-settings`、`sqlalchemy`@2、`httpx`、`apscheduler`@3、`python-multipart`、`pdfplumber`、`tzdata` | `pytest`、`respx`、`ruff` |

调用大模型直接用 `httpx`，不安装任何大模型 SDK。

验收修订（2026-10-31，P3）：前端开发依赖增加 `prettier`@3，用于统一格式化和 lint 格式检查。

**字体：** 通过 `next/font/google` 加载：

| 字体 | 字重 | CSS 变量 |
|---|---|---|
| Archivo | 500–900 | `--font-archivo` |
| Hanken Grotesk | 400–700 | `--font-hanken` |
| Space Mono | 400、700 | `--font-space-mono` |
| Noto Sans SC | 400、500、700、900；`preload: false` | `--font-noto-sc` |

四个字体对象的 `.variable` 类都加在 `<html lang="zh-CN">` 上。

**联网：** 安装依赖、下载字体和 Playwright 浏览器时需要联网。环境不能联网时，按 AGENTS.md 的流程提问，不要换字体或换包。

## 5. 环境变量与全局定义

`backend/.env`：

| 变量 | 取值 | 缺省 |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy URL | `sqlite:///./data/app.db` |
| `TIMEZONE` | IANA 时区 | `Asia/Shanghai` |
| `AS_OF_DATE` | `YYYY-MM-DD` | 空，即按 `TIMEZONE` 取当日 |
| `COLLECTOR_MODE` | `live` / `fixture` | `live` |
| `SCHEDULER_ENABLED` | `true` / `false` | `true` |
| `CORS_ORIGINS` | 逗号分隔 | `http://127.0.0.1:3000,http://localhost:3000` |

`frontend/.env.local`：`NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000`

**测试和 E2E 配置：**

- 共用：`COLLECTOR_MODE=fixture`、`AS_OF_DATE=2026-10-31`、`SCHEDULER_ENABLED=false`
- 单元测试：每个测试用自己的临时 SQLite 文件
- E2E：`DATABASE_URL=sqlite:///./data/e2e.db`。每次运行前删除该文件；由 `playwright.config.ts` 的 `webServer` 依次按以上配置启动后端和前端。
- 测试库中不保存模型配置，智能体走夹具

**全局定义：**

- **今天**：等于 `AS_OF_DATE`；该变量为空时，取 `TIMEZONE` 下的当前日期。
- **business_date**：流水线批次、智能体步骤、重算批次、决策、规则版本、审计事件，在创建时都记录 `business_date = 今天`。所有「今天 / 当天 / 今日」的判断都比较这个字段，不比较真实时间戳。
- **显示时间**：顶栏时间、审计时间、批次 ID 都用真实时钟（北京时间）。
- **基准批次**：as_of 等于今天的重算批次中，最新的一个。收件箱、`/api/meta`、日报、观察项、决策都基于基准批次。任何需要基准批次的请求或任务发现今天还没有基准批次时，先自动新建一个，再继续。

## 6. 数据流

**启动：**

1. 建表。
2. 规则表为空时，导入 `seed/engine/rules.json`（每条规则建一个版本，来源记为 `seed`）。
3. 订单表为空时，导入 `seed/engine/orders_sample.csv`。
4. 新建一个基准批次。
5. `SCHEDULER_ENABLED=true` 时启动调度器。

**每日 07:30 或手动运行：**

1. 依次运行 `collector_fr` → `collector_pi` → `collector_usitc` → `triage` → `extract` → `validate` → `brief`。
2. 生成规则草稿，草稿状态为 `draft`。
3. 生成当日日报。如果当天已有日报，覆盖它。

**确认草稿：**

1. 按 AI_PIPELINE.md §5 转换为新的规则版本。
2. 只要新建了规则版本，就自动新建一个基准批次。

**驳回、标记需补充：** 只更新草稿状态。

**导入订单成功、或点击「重新计算」：** 新建一个基准批次。

## 7. 规则存储

- 每个规则版本有以下字段：
  - `rule_kind`：`meta` / `fees` / `program` / `hts_profile` / `watch_item`（`meta` 和 `fees` 各只有一条，rule_id 分别为 `meta`、`fees`）
  - `rule_id`
  - `version`
  - `status`：`active` / `superseded`
  - `source`：`seed` / `draft:<id>`
  - `business_date`
  - `payload`：结构与 `rules.json` 中对应对象相同
  - `change_type`：来自草稿时记录草稿的 change_type；种子为 null
- 只追加，不改写。修改一条规则 = 新增一个版本，并把旧版本标为 `superseded`。
- 规则快照 `build_snapshot()`：每个 `rule_id` 取版本号最大的那个版本，组装成与 `rules.json` 相同的结构，交给引擎计算。`programs` 列表、`hts_profiles` 和 `watch_items` 的键顺序，按各 rule_id 首个版本的创建顺序排列；种子按 `rules.json` 中的原顺序导入。

## 8. 引擎移植

1. 把 `seed/engine/engine.py` 中的 `layers_for`、`s301_list_rate`、`total_rate`、`fees`、`seller_profit`、`clause_share`、`evaluate` 原样复制到 `backend/app/engine/core.py`，不改算式、阈值、分支和中文文案。
2. `evaluate` 的返回值只允许新增以下字段：
   - `layers`：每层包含 `id`、`rate`、`heading`、`refund_status`，以及 `duty_usd = customs_value × rate / 100`
   - `revenue_usd`
   - `seller_cost_baseline_usd`、`seller_cost_new_usd`
   - `timing_boundary_date`、`timing_saving_usd`
   - `watch_ids`：取该订单 profile 的 `watch` 列表
3. `adapter.py` 负责三件事：
   - 从数据库组装规则快照和订单输入
   - 调用 `evaluate`，传入 `as_of = 今天`、`scenario = None`
   - 生成 `checks`、`countdown`、`chain`、`agent_chain`、`sources`（定义见 API.md §6）

## 9. 业务规则

**决策**

- 只能对基准批次做决策：采纳建议 / 不处理 / 需补充。
- 一次决策只做两件事：更新该订单的处理状态，写一条审计。不发通知，不改订单。
- 可以重复提交，以最后一次为准。每次提交都会写审计。
- 新的基准批次生成时，逐单对比上一个基准批次：利润变化（容差 0.01）和风险等级都没变，就沿用原处理状态；有任一项变化，就重置为待处理。

**订单导入**

- 按 `order_id` 新增或覆盖；文件里没有的订单不删除。
- 文件中只要有一行校验失败，整个文件都不导入。
- `hts10` 不在规则库 `hts_profiles` 中的行直接报错，错误信息列出规则库支持的税号。

**规则草稿**

- 未确认的草稿不影响收件箱里的数字，只在「规则审核」页显示预估影响。
- 「规则审核」页不能编辑字段，只能确认 / 驳回 / 需补充。
- 存在不通过的校验项时，不能确认。

**大模型**

- 「模型接入」页保存了配置（接口地址、API Key、模型名）后，智能体调用该接口。
- 未保存配置时，智能体只用 `backend/fixtures/llm/` 中的固定输出。没有固定输出时，记为 `skipped_no_fixture`，不生成替代内容。

**日报**

- 每天一份，只在站内查看，可按日期查阅。

## 10. 安全

- 后端用 `--host 127.0.0.1` 启动，前端用 `next dev -H 127.0.0.1` 启动。
- 采集器只访问以下三个主机，接口返回的其他主机链接一律不下载，并计入该步骤的错误数：
  - `www.federalregister.gov`
  - `public-inspection.federalregister.gov`
  - `hts.usitc.gov`
- 采集器的 User-Agent 固定为 `MarinerAI/0.1`。请求间隔 ≥ 1 秒，超时 30 秒，失败时重试 3 次，指数退避。
- 来源校验：后端拒绝 `Origin` 请求头存在、但不在 `CORS_ORIGINS` 中的请求（返回 403）；`Host` 只接受 `127.0.0.1:8000` 和 `localhost:8000`（用 Starlette 的 TrustedHostMiddleware 实现）。
- API Key 存在本地 SQLite 的 `llm_settings` 表中。接口只返回掩码（形如 `****` 加后 4 位），不回传明文。
- 订单数据不外发，大模型只接收公开的政策文本。

## 11. 术语

| 术语 | 含义 |
|---|---|
| 重算批次 | 对全部订单的一次计算，ID 格式 `RUN-YYYYMMDD-HHMMSS-xxxx`（xxxx 为 4 位随机十六进制） |
| 流水线批次 | 一次采集到日报的运行，ID 格式 `PIPE-YYYYMMDD-HHMMSS-xxxx` |
| 草稿 ID | `DRAFT-{document_number}`（每篇文件最多一个草稿） |
| 规则草稿 | 抽取智能体产出、尚未确认的规则变更 |
| 观察项 | 不改变税率、但需要提示的政策事项 |
| 法律状态 | `in_force` / `signed_pending` / `scheduled_expiry` / `proposed` / `investigation` / `negotiation_no_tariff` / `court_ruling` / `procedural` |
