# Mariner AI v0.2.1 开发验收记录

日期：2026-10-31。依据 `V021_SPEC.md`，按 `TASKS_V021.md` 的 T-15.1 至 T-15.7 顺序实现与验收。

## 已验证结果

| 任务 | 结果与证据 |
|---|---|
| T-15.1 | 写接口响应前提交。100 次新建后立即发送全部 200，50 次决策后立即读取一致；额外用独立会话检查写入已提交。 |
| T-15.2 | 九组指定问题的检索结果符合任务表；中英文分词、停用词、排名、兜底、订单置顶和去重已实现。 |
| T-15.3 | respx 检查日期、订单开关、提及订单、最多六条历史和 `chat_v2.md`；关闭开关仍识别 O5，数字守卫可引用历史文本。 |
| T-15.4 | 模拟连接失败返回 200 并保存双方消息，助手标记 error；中英文错误通过。浏览器验证错误样式、重试按钮及同一问题重新发送。 |
| T-15.5 | 对话排序、标题、删除消息及审计通过；关联导入任务保留。浏览器验证切换、URL、刷新及删除当前对话后选择下一条。 |
| T-15.6 | 系统条目删除后从默认列表和检索排除，流水线保留删除状态；恢复刷新系统内容并记审计。删除 impact:O5 前后完整影响单响应一致。浏览器验证已删除筛选与恢复。 |
| T-15.7 | 版本统一为 0.2.1，发布说明及英文审阅清单已更新。 |

检查结果：Ruff 通过；pytest **43 passed**；前端 ESLint / Prettier、TypeScript 通过；Windows Chromium Playwright **12 passed**；Next.js 生产构建通过。

后端测试使用独立测试数据库；E2E 使用可重建的 `backend/data/e2e.db`、127.0.0.1 的 3001 / 8001 端口、`AS_OF_DATE=2026-10-31`、`COLLECTOR_MODE=fixture`、`SCHEDULER_ENABLED=false`。生产构建使用已有离线字体夹具。检查后恢复 Next.js 因测试构建目录自动改写的 TypeScript 配置，再完成 lint 与 typecheck。

## 截图

全部为 1440×900，并已逐张查看：

- [T-15.4.png](acceptance/v0.2.1/T-15.4.png)：模型失败及重试。
- [T-15.5.png](acceptance/v0.2.1/T-15.5.png)：对话记录及选中状态。
- [T-15.6.png](acceptance/v0.2.1/T-15.6.png)：已删除知识及恢复入口。
- [T-15.6-restored.png](acceptance/v0.2.1/T-15.6-restored.png)：恢复后重新显示；长标题不会挤压删除按钮。

验收原图保存在本机 `artifacts/screenshots/`，发布副本随仓库保存在 `docs/acceptance/v0.2.1/`。

## 实现说明与验证边界

- 知识条目的 deleted / deleted_at 沿用现有 KbEntry JSON payload 存储架构，旧记录缺失时按 false / null 读取。
- 未更改关税引擎、规则税率或 golden 文件；现有 golden 测试包含在上述 pytest 中。
- 模型相关验收使用 respx 或浏览器请求拦截，未验证真实模型服务或线上政策采集。夹具中的关税事实是演示快照，未独立核实其现实有效性。
- pytest 有一条现有 Starlette TestClient 关于 httpx 的弃用提示，未影响测试结果。
- 新增 Q 编号：无。当前没有因规格未明确而跳过的任务。
