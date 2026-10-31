# Mariner AI v0.2 开发验收记录

日期：2026-10-31。范围：用户确认的整套 v0.2，依据 `V02_SPEC.md`。本记录是开发侧验证，不代替用户验收或真实环境联调。

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
