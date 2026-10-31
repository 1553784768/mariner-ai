# Mariner AI

本地单用户关税影响工作台：订单 CSV → 确定性引擎 → 风险收件箱；政策采集 → 分诊与抽取 → 人工审核 → 政策日报。

后端 FastAPI / SQLite，前端 Next.js 16。只监听 `127.0.0.1`，订单内容不发送给模型。种子规则是演示快照，未核实字段会在界面中提示；不代表独立核验的现行关税事实。

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

打开 [风险收件箱](http://127.0.0.1:3000/inbox)。去掉 fixture 参数后使用 `.env` 配置；默认每天北京时间 07:30 采集。Windows 脚本日志位于 `artifacts/`，按 Ctrl+C 关闭该脚本启动的进程。

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
# Stop manually started servers on 3000/8000 before E2E.
npx playwright test
```

Linux/macOS 的后端可执行文件位于 `.venv/bin/`。自动化测试不访问外部政策或模型服务，live 路径通过 respx 模拟，模型页面通过 Playwright 拦截请求验证。

后端运行时执行 `npm run gen:api` 生成 `frontend/src/lib/api-types.ts`。开发环境组件展示位于 `/dev/components`，生产构建中返回 404。

任务验收见 `docs/TASKS.md`；待确认的规格缺口见 `docs/QUESTIONS.md`。截图输出到 `artifacts/screenshots/`。
