# Mariner AI

本地单用户关税影响工作台：订单 CSV → 确定性引擎 → 风险收件箱；政策采集 → 分诊与抽取 → 人工审核 → 政策日报。

后端 FastAPI / SQLite，前端 Next.js 16。只监听 `127.0.0.1`，订单内容默认留在本机；仅在导入弹窗确认或对话中主动开启订单数据时发送给模型，并记录审计。种子规则是演示快照，未核实字段会在界面中提示；不代表独立核验的现行关税事实。

## 安装

需要 Python 3.12 和 Node.js（满足 Next.js 16 要求）。在本目录执行：

```powershell
py -3.12 -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt -r backend/requirements-dev.txt
cd frontend
npm ci
npx playwright install chromium
cd ..
```

若 Python 3.12 未注册在 `py` 启动器中，可将第一行的 `py -3.12` 换成已安装 Python 3.12 的绝对路径。本机验证使用 Codex 自带的 Python 3.12。

macOS / Linux：第一行改成 `python3.12 -m venv backend/.venv`，后端可执行文件使用 `backend/.venv/bin/python`。其余 npm 命令相同。

复制 `backend/.env.example` 为 `backend/.env`、`frontend/.env.example` 为 `frontend/.env.local` 后按需配置。默认采集模式为 live；离线演示请使用下面的 fixture 参数。安装依赖、字体及浏览器需要联网。

## 启动

```powershell
./scripts/dev.ps1 -Fixture
```

```bash
bash scripts/dev.sh --fixture
```

打开 [工作台](http://127.0.0.1:3000/)。去掉 fixture 参数后使用 `.env` 配置；默认每天北京时间 07:30 采集。Windows 脚本日志位于 `artifacts/`，按 Ctrl+C 关闭该脚本启动的进程。

fixture 模式固定 `AS_OF_DATE=2026-10-31`，关闭调度；未配置模型时使用内置分诊、抽取夹具。首次在流水线页点击「立即运行」后生成 2 张草稿及 9 条日报。模型接入页将 API Key 保存在本地 SQLite，读取接口只返回掩码。测试连接只发送 `ping`。

生产数据文件是 `backend/data/app.db`，脚本不会删除它。E2E 专用 `backend/data/e2e.db` 每次测试前重建。

## 测试

```powershell
cd backend
.venv/Scripts/ruff check .
.venv/Scripts/python -m pytest -q
cd ../frontend
npm run lint
npm run typecheck
npm run build
# E2E uses isolated ports 3001/8001 and its own database.
npx playwright test
```

Linux/macOS 的后端可执行文件位于 `.venv/bin/`。自动化测试不访问外部政策或模型服务，live 路径通过 respx 模拟，模型页面通过 Playwright 拦截请求验证。

后端运行时执行 `npm run gen:api` 生成 `frontend/src/lib/api-types.ts`。开发环境组件展示位于 `/dev/components`，生产构建中返回 404。

v0.2 验证结果和剩余边界见 [验收记录](docs/ACCEPTANCE_V02.md)，任务状态见 [TASKS_V02](docs/TASKS_V02.md)；规格问题见 `docs/QUESTIONS.md`。截图输出到 `artifacts/screenshots/`。

## v0.2 工作台与知识库

- 工作台支持带知识引用的问答、数字守卫、新对话和附件导入。订单数据开关默认关闭；未配置模型时仅支持内置示例问题。
- 知识库集中展示政策、观察项、规则、日报及订单影响单。可编辑的条目支持恢复系统版本；订单与影响单只读，编辑知识不会改变引擎计算。
- CSV、标准 XLSX、带标准表格的 PDF 在本地解析；其他受支持文件须在弹窗中确认后由模型识别。最多 10 MB、200 行，识别结果须预览、校验后确认导入。
- 风险收件箱可勾选具体建议再采纳，或填写补充说明。输入框中的快捷键不会触发全局决策。
- 侧栏「中 / EN」切换语言并保存在浏览器；知识编辑分别保存两种语言。英文文案审阅见 `docs/i18n-review.md`。

## 真实环境冒烟测试

先启动本地服务，在「模型接入」配置兼容接口，并使用 `COLLECTOR_MODE=live`。然后从仓库根目录运行：

```powershell
backend/.venv/Scripts/python scripts/live_smoke.py
# Optional: --base-url http://127.0.0.1:8001 --timeout 300
```

Linux/macOS 使用 `backend/.venv/bin/python`。脚本调用本地服务，创建流水线和一段不含订单数据的问答，逐项报告 health、模型连接、流水线、采集器、数字守卫。该操作会写入本地业务记录；模型与采集步骤在 live 模式下会访问已配置服务。失败项使脚本返回退出码 1。

在全新 fixture 数据库且未配置模型时，预期第 1、3、4、5 项 PASS，第 2 项 FAIL（未配置模型）。fixture 流水线可为 partial，因为部分文件有意不提供模型夹具；第三项只要求非 failed 且 triage 无错误。此结果不代表真实模型和线上政策服务已通过联调。
