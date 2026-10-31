# TASKS_V021.md

期望值基于以下条件：

- 环境变量：`AS_OF_DATE=2026-10-31`、`COLLECTOR_MODE=fixture`、`SCHEDULER_ENABLED=false`。
- 数据库：全新建库，并已跑完一次 fixture 流水线。

需要真实模型的测试，用 respx 或本地桩服务模拟 OpenAI 兼容接口。

## M15 v0.2.1 修复

### T-15.1 写操作提交时机 — 状态：DONE（2026-10-31）

- **完成说明：** 验证：独立数据库会话确认提交已可见；连续 100 次新建后发送均为 200，50 次决策后立即读取均一致（test_v021.py）。

- **验收：**
  1. 后端连续 100 次「新建对话 → 立即发送消息」，结果全部是 200。
  2. 连续 50 次「提交决策 → 立即 GET 详情」，每次读到的状态都和提交的一致。

### T-15.2 对话检索 — 状态：DONE（2026-10-31）

- **完成说明：** 验证：九组指定检索结果全部通过，并补测中英文混合分词的首次出现顺序（test_v021.py）。

- **验收：** 对 `retrieve()` 写单元测试，依次检查以下问题的返回 id 列表。未注明时，`use_order_data` 一律为 false。

| 问题 | 期望结果 |
|---|---|
| 今日政策变化 | `brief:2026-10-31, policy:2026-20510, watch:W_301_EXCLUSION_EXPIRY, watch:W_232_ROBOTICS, watch:W_301_EXCESS_CAPACITY` |
| 你好 | `brief:2026-10-31, watch:W_301_EXCLUSION_EXPIRY, watch:W_232_ROBOTICS, watch:W_301_EXCESS_CAPACITY` |
| 今天有哪些需要关注的政策？ | 与「你好」相同 |
| What changed today? | 与「你好」相同 |
| 机器人关税有变化吗 | 第一条为 `policy:2026-22385` |
| 邮政小包有什么新规定 | 第一条为 `policy:2026-21600` |
| IEEPA 退款怎么办 | 第一条为 `policy:2026-20228` |
| 那它什么时候到期？（`prev_question`=「301排除的情况」） | 第一条为 `watch:W_301_EXCLUSION_EXPIRY` |
| O5 为什么是红色？（`use_order_data=true`） | 前两条为 `impact:O5, order:O5` |

### T-15.3 上下文与提示词 — 状态：DONE（2026-10-31）

- **完成说明：** 验证：respx 核对四个新增字段、最近六条历史、关闭订单数据时仍识别 O5，以及 chat_v2.md 提示词（test_v021.py）。

- **验收：** 用 respx 检查发给模型的 user JSON：
  1. 包含 `as_of`、`order_data_enabled`、`mentioned_orders`、`history` 四个字段，`history` 最多 6 条。
  2. 问「O5 为什么是红色？」且 `use_order_data=false` 时，`mentioned_orders=["O5"]`。
  3. system 提示词使用的是 `chat_v2.md`。

### T-15.4 模型失败时保留消息 — 状态：DONE（2026-10-31）

- **完成说明：** 验证：respx 连接失败返回 200，双方消息持久化及中英文错误通过；E2E 验证重试发送同一问题；截图 artifacts/screenshots/T-15.4.png。

- **验收：** 用 respx 模拟连接失败：
  1. 接口返回 200。
  2. 助手消息 `error=true`，text 为「无法连接模型服务」。
  3. 两条消息都能在 `/api/chat/conversations/{id}` 中查到。
  4. 前端显示「重试」按钮；用 E2E 拦截请求，检查点击后会重新发送同一问题。

### T-15.5 对话历史 — 状态：DONE（2026-10-31）

- **完成说明：** 验证：列表排序、标题截断、删除消息及审计、保留导入任务通过；E2E 切换、URL、刷新及删除后打开下一条通过；截图 artifacts/screenshots/T-15.5.png。

- **验收：**
  1. 建两个对话，各发一条消息。列表按 `updated_at` 倒序排列，标题取各自的第一条用户消息。
  2. 删除其中一个：列表剩 1 条，该对话的消息查不到，审计中有 `CHAT_DELETED`。
  3. E2E：
     - 点列表项能切换对话，URL 中的 `c` 参数随之变化；
     - 刷新页面后仍停留在同一个对话；
     - 截图。

### T-15.6 知识库删除 — 状态：DONE（2026-10-31）

- **完成说明：** 验证：删除过滤、检索排除、流水线保留删除状态、恢复同步及审计通过；删除 impact:O5 后影响单数据完全一致；E2E 筛选和恢复通过；截图 artifacts/screenshots/T-15.6.png、T-15.6-restored.png。

- **验收：**
  1. 删除 `policy:2026-21755`：默认列表中没有它；`deleted=true` 的列表中有它；对 「USTR 海事」做检索时也找不到它。
  2. 再跑一次流水线后，这条仍是已删除状态。
  3. 执行 undelete 后，它重新出现在列表中，审计中有 `KB_UNDELETED`。
  4. 删除 `impact:O5` 后，`/api/impacts/O5` 的数字完全不变。
  5. E2E：
     - 「已删除」筛选能看到被删的条目；
     - 恢复按钮可用；
     - 截图。

### T-15.7 版本与文档 — 状态：DONE（2026-10-31）

- **完成说明：** 验证：VERSION、前后端版本统一为 0.2.1；已补 RELEASE_NOTES、i18n-review 和 ACCEPTANCE_V021；Ruff、43 项 pytest、前端 lint、typecheck、12 项 Playwright 及生产构建通过。

- **内容：**
  - `VERSION` 改为 `0.2.1`。
  - RELEASE_NOTES 增加 v0.2.1 一节。
  - `docs/i18n-review.md` 补上 §7 的新增文案。
