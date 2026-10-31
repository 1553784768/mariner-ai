# Mariner AI v0.2.0：交给 Claude 的验收报告

日期：2026-10-31（Asia/Shanghai）。这是实现方的开发验收与交接材料，尚非独立验收结论。

## 结论

已按用户确认实现整套 v0.2：P1–P14 反馈处理、知识库、AI 工作台、多模态订单导入、中英文切换。任务表共 22 项，21 项 DONE，T-9.6 因未在 Linux 执行 Playwright 保持 PARTIAL。P2 的真实联调仍待验收，P11 依规格暂缓。不能称作全部验收无条件通过。

项目：`C:/Users/15537/Documents/ChatGPT/三城黑客松/astra-dev-spec`。
Git 根目录是其父目录 `三城黑客松`，从仓库取源码时进入 `astra-dev-spec` 再运行命令。

版本：`v0.2.0`。
仓库：https://github.com/1553784768/mariner-ai
发布入口：https://github.com/1553784768/mariner-ai/releases/tag/v0.2.0

## 已确定的启动状态

2026-10-31 18:56（北京时间）实测：后端 `/api/health` 返回 `ok`，OpenAPI 版本 `0.2.0`；收件箱、首页工作台和知识库均 HTTP 200，三页字体错误数为 0，浏览器 `pageerror` 为 0。

- 前端：http://127.0.0.1:3000/
- 收件箱：http://127.0.0.1:3000/inbox
- 后端：http://127.0.0.1:8000/api/health
- 前后端仅监听 `127.0.0.1`，端口分别为 3000/8000。
- 启动方式：后台 `scripts/dev.ps1 -Fixture`；`DATABASE_URL=sqlite:///./data/claude-acceptance.db`，`AS_OF_DATE=2026-10-31`，`COLLECTOR_MODE=fixture`，`SCHEDULER_ENABLED=false`。
- 沿用已有验收数据库，未清空 `app.db` 或现有验收记录。本轮重启后查询显示：待处理 7、红色 1、紧急 1、待审草稿 12、决策总计 5，`llm_configured=true`。这些是已有状态，不是干净种子期望值。
- 模型“已配置”只代表设置存在；本次启动检查未发送模型请求，不据此断言真实模型联调通过。
- 开发日志仍有动画库弃用/空目标警告；它们未触发本次页面异常，但不应被描述为控制台完全无警告。

启动器 PID 见 `artifacts/acceptance-launch.pid`；日志见 `artifacts/acceptance-launch-v02*.log`、`artifacts/backend*.log`、`artifacts/frontend*.log`。
可随 Git 复查的启动证据：`docs/acceptance/v0.2/startup.json` 和 `docs/acceptance/v0.2/screenshots/CLAUDE-v02-*.png`。

复现配置（当前服务正在运行，勿重复启动占用端口）：

```powershell
Set-Location 'C:/Users/15537/Documents/ChatGPT/三城黑客松/astra-dev-spec'
$env:DATABASE_URL = 'sqlite:///./data/claude-acceptance.db'
./scripts/dev.ps1 -Fixture
```

测试使用隔离的 3001/8001 端口与 e2e.db，具体命令见 README。不要对 `app.db` 执行测试清库流程。

## 验证事实、边界与复核依据

以下开发检查结果来自本轮 v0.2 实现阶段；启动后仅增加文档和证据，未重复执行没有改动的业务测试。37 项 pytest 与 9 项 Playwright 通过，并不证明所有输入、所有外部模型或所有平台都正确。

## 已实现

- 决策：指定采纳建议、必填补充说明、输入区域快捷键保护、决策沿用与双语审计。
- 知识库：自动同步、FTS5 检索、手动条目、分语言编辑、查看和恢复系统版本；订单及影响单只读。
- 工作台：知识问答、引用跳转、数字守卫及一次重试；订单数据默认关闭，主动开启才进入问答上下文。
- 导入：CSV、标准 XLSX/PDF 本地解析，其他受支持文件先确认再调用模型；可编辑预览、逐行校验、确认入库、取消、清除原文件字节和过期清理。
- 中英文界面、引擎文本适配、双语分诊/抽取及审计；版本升级为 0.2.0。

## 验证结果

| 检查 | 结果及范围 |
|---|---|
| 后端 Ruff | 通过 |
| pytest | 37 passed，28.01 秒；包含原有 golden 和安全校验，外部 HTTP 用 respx 模拟 |
| 前端 lint / Prettier / TypeScript | 通过 |
| 生产构建 | 通过，生成 11 个路由；构建字体使用本地测试资源 |
| Playwright | Windows Chromium，9 passed，54.4 秒；原有 2 项加 v0.2 的 7 项 |
| 冒烟脚本 | 独立全新 fixture 数据库：1/3/4/5 PASS，2 FAIL（未配置模型），符合 T-9.5；退出码 1 为预期 |
| 双语清单 | `i18n-review.md` 已生成，含前端全部 272 项及后端模板，译文待用户审阅 |

测试使用独立 3001/8001 端口和 `backend/data/e2e.db`；冒烟使用另一个全新测试库。未清空用户的 `backend/data/app.db`。pytest 有一条 Starlette/httpx 弃用警告，测试通过。

日志：`artifacts/validation/smoke-fixture.txt`、`artifacts/validation/smoke-server.log`。浏览器截图均为 1440×900，位于 `artifacts/screenshots/`。

## 原反馈逐项处理

| 反馈 | 状态 | 实现或证据 |
|---|---|---|
| P1 快捷键误触 | 已修复 | 输入区域屏蔽全局决策快捷键；E2E 确认 Ctrl+Backspace 删除词且无新增决策 |
| P2 真实联调 | 尚未完成真实联调 | 已实现并验证冒烟脚本；没有真实 Key/线上采集端到端成功证据 |
| P3 超长代码 | 已修复 | Prettier printWidth 110，lint 纳入格式检查，现有前端已格式化 |
| P4 错误原因 | 已修复 | 流水线显示本次第一条错误；连接、超时、HTTP、JSON 分类并提供英文 |
| P5 Q-001 | 已修复（A） | O5 卖方成本变化 +$16,000.00，毛利率变化 −17.8pp；后端与 E2E 验证 |
| P6 测试连接提示 | 已修复 | 可解析但非 ok:true 与 JSON 解析失败分别提示，respx 验证 |
| P7 无红单结论 | 已修复 | 无待处理红单时显示专用中英文句子，pytest 验证 |
| P8 重复摘要 | 已修复 | 日报标题与摘要相同则不重复展示 |
| P9 字体断言 | 修正已完成，Linux 待验证 | 排除名称以 Fallback 结尾的字体族；当前仅有 Windows E2E 通过证据 |
| P10 表格与头部 | 已修复 | 分层首列 nowrap 并可横向滚动；头部符合 v0.2 格式，E2E 验证 |
| P11 订单编号 | 按规格暂缓 | 保留 O5 等编号，避免改动历史数据和 golden |
| P12 Logo | 已修复 | next/image priority，品牌版本 v0.2 |
| P13 分诊计数 | 已修复 | 审计只取本次运行的相关结果 |
| P14 草稿校验 | 已修复 | program_add 重复 id 和空 watch target_id 拒绝，pytest 验证 |

## 主要截图

| 功能 | 文件（相对仓库根目录） |
|---|---|
| 决策与补充说明 | `artifacts/screenshots/T-10.2-adopted.png`、`T-10.2-note.png` |
| 知识库及来源变化 | `artifacts/screenshots/T-11.3.png`、`T-11.3-source-changed.png` |
| 工作台及数字守卫 | `artifacts/screenshots/T-12.3.png`、`T-12.3-guard.png` |
| 导入确认、预览、错误 | `artifacts/screenshots/T-12.4-consent.png`、`T-12.4.png`、`T-12.4-invalid.png` |
| 英文七页面 | `artifacts/screenshots/T-13.1-{workbench,inbox,knowledge,brief,review,pipeline,settings}.png` |

## 规格冲突和剩余边界

- `TASKS_V02.md` T-12.2 写 PATCH，但 `V02_SPEC.md` §6.5 指定 PUT，§9 CORS 也只列 GET/POST/PUT/DELETE。按文档优先级实现 PUT；测试使用 PUT。
- T-9.6 要求在 Linux 上执行 Playwright，当前环境为 Windows，因此保持 PARTIAL，不声明全部任务无条件完成。
- 未使用真实模型及线上政策采集完成联调；PDF/图片真实识别质量仍取决于实际模型，离线夹具和 HTTP 模拟不能证明其真实识别质量。
- 关税数字及日期保留项目演示快照，未独立核实现实有效性；计算逻辑、规则税率日期和 golden 期望值未改动。



## 交给 Claude 的复核重点

请以源代码及可复现结果为准，分别记录通过、失败和未验证项。先阅读 `AGENTS.md`、`docs/V02_SPEC.md`、`docs/TASKS_V02.md`。文档优先级：V02_SPEC > SPEC > API > AI_PIPELINE > DESIGN > TASKS_V02 > TASKS。

1. 在原反馈逐项回归基础上，验证知识库编辑不改变计算、订单/影响单只读、来源变化与恢复系统版本。
2. 验证工作台引用、数字守卫及重试；默认不发送订单数据，开启后才发送，敏感操作留审计。
3. 验证 CSV/XLSX/标准 PDF 本地解析；需要模型的图片/PDF须先同意，再提取，预览编辑并校验后人工确认入库，取消与过期清理可用。
4. 验证采纳具体建议、补充说明和输入区域快捷键；切换中英文后核对各页、模型提示与审计。
5. 对真实模型、线上采集及 Linux E2E 单独验收；不要把离线夹具结果当作真实识别质量证据。现有模型配置不在交付文件中，不应在报告中披露 Key。

附件截图的 Git 路径统一为 `docs/acceptance/v0.2/screenshots/`；上文 `artifacts/screenshots/` 是本机原始路径。不同截图来自不同数据库/操作阶段，计数不可直接跨截图比较。

参考资料：`docs/i18n-review.md`、`docs/RELEASE_NOTES.md`、`docs/acceptance/Mariner-v0.1-验收反馈.md`。旧版交接报告已归档为 `docs/acceptance/ACCEPTANCE_V01_FOR_CLAUDE.md`，其中的 Q-001 阻塞与 v0.1 任务计数仅描述历史版本；Q-001 已按 v0.2 的 A 方案解决。

本次没有新增待决策 Q 编号。已知未验证事项已如上列明，关税演示快照未被当作已核实的现实政策。
