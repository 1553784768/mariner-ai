# Cloudflare Pages 网页发布

本仓库发布仅关税版的静态前端。Python API、SQLite、模型对话与数据保存仍需部署后端；Pages 本身不运行本仓库的 FastAPI 服务。未接入后端时，不应将网页发布成功表述为业务功能已上线。

Cloudflare 控制台中进入 Workers & Pages → 创建应用 → Pages → 导入现有 Git 仓库，选择：

| 配置 | 值 |
|---|---|
| GitHub 仓库 | `1553784768/mariner-ai` |
| 项目名称 | `mariner-tariff-demo`（若已被占用可调整） |
| 生产分支 | `codex/mariner-ai-preview` |
| 根目录 | `astra-dev-spec/frontend` |
| 框架预设 | Next.js (Static HTML Export)，或 None 后手填下面两项 |
| 构建命令 | `npm run build:pages` |
| 输出目录 | `out` |
| Node.js 环境变量 | `NODE_VERSION=24` |

`build:pages` 自动启用静态导出，并默认使用同站点 `/api` 地址。静态目录为 `out`，不应填 `.next`。已提交的 `wrangler.jsonc` 也声明了输出目录。

若未来将 API 部署到独立域名，需要在构建环境中设置 `NEXT_PUBLIC_API_BASE=https://实际后端地址`，重新构建，并为后端配置对应的 Host、Origin 和访问控制。当前原版后端只允许本机请求，不能只修改这个前端变量就视为完成后端公网部署。

GitHub 应用授权时，可仅选择这个仓库及融合版仓库 `1553784768/trade-ai-mariner`。不要把服务器密码或模型密钥填入任何 `NEXT_PUBLIC_` 变量。

部署后以 Cloudflare 实际显示的网址为准；不能预先保证 `mariner-tariff-demo.pages.dev` 已被分配。验证首页、`/inbox`、`/settings` 直接访问，以及静态资源无 404。当前页面需要 API 才能加载业务数据；尚无可用后端时会显示请求错误。
