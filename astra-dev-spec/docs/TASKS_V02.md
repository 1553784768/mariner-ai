# TASKS_V02.md

**测试配置：**

- 期望值默认基于 `AS_OF_DATE=2026-10-31`、`COLLECTOR_MODE=fixture`、`SCHEDULER_ENABLED=false`，且未配置模型。

**完成标记：** 每完成一个任务，把状态改为 `DONE（日期）`。

## M9 修复

### T-9.0 代码格式化与旧测试调整 — 状态：DONE（2026-10-31）

- **验证说明：** Prettier 110、ESLint/格式检查通过，旧测试已按新行为调整。

- **内容：**
  - 加入 Prettier。
  - 格式化前端全部代码。
  - lint 中加入格式检查。
  - 按 v0.2 的行为调整 v0.1 的测试：
    - `test_business.py` 中的 `adopted` 请求补上 `action_indices`；
    - v0.1 E2E 改为先勾选建议再按 Ctrl+Enter；
    - 导航断言加入「工作台」「知识库」；
    - 文档头部断言按 P10 调整。
- **验收：**
  - `npm run lint` 通过。
  - `frontend/src` 中没有超过 110 字符的代码行（字符串常量除外）。

### T-9.1 快捷键 — 状态：DONE（2026-10-31）

- **验证说明：** E2E 验证输入框 Ctrl+Backspace 删除词且不增加决策；截图 T-9.1.png。

- **内容：** P1。
- **验收：** 新增 E2E：在搜索框输入 `abc def` 后按 Ctrl+Backspace，结果需满足两点：
  - `/api/decisions` 的条数不变；
  - 输入框变为 `abc `。

### T-9.2 错误信息 — 状态：DONE（2026-10-31）

- **验证说明：** respx 覆盖连接、超时、401、非 JSON 和 ok:false；流水线显示第一条错误。

- **内容：** P4、P6。
- **验收：** 用 respx 模拟以下 5 种情况，分别检查 `steps[].message` 和测试连接接口返回的 `message`：
  - 连接失败 →「无法连接模型服务」
  - 超时 →「模型请求超时」
  - 返回 401 →「HTTP 401：…」
  - 返回非 JSON →「模型返回内容不是符合要求的 JSON」
  - 测试连接返回 `{"ok": false}` →「模型已响应，但返回内容不是 {"ok": true}」

### T-9.3 小修 — 状态：DONE（2026-10-31）

- **验证说明：** 37 项 pytest、9 项 E2E 通过；零红单结论、重复 program id 和空观察项校验已覆盖。

- **内容：** P7、P8、P10、P12、P13、P14。
- **验收：**
  1. pytest 和 E2E 全部通过。
  2. 日报：在没有待处理红单的情况下，结论为「…没有待处理的红色订单。」
  3. 构造重复 id 的 `program_add` 草稿，V8 判为 fail。

### T-9.4 Q-001 — 状态：DONE（2026-10-31）

- **验证说明：** O5 后端差值为 16000 / −17.78，E2E 验证 +$16,000.00 / −17.8pp。

- **验收：** O5 的结果满足：
  - `seller_cost_delta_usd` = 16000.00；
  - `margin_delta_pp` = −17.78；
  - 利润表变化列显示 `+$16,000.00` 和 `−17.8pp`。

### T-9.5 冒烟测试脚本 — 状态：DONE（2026-10-31）

- **验证说明：** 独立全新 fixture 数据库冒烟结果 1/3/4/5 PASS、2 FAIL（未配置模型），脚本正常结束；日志见验收记录。

- **内容：** 按 V02_SPEC §8 编写脚本。
- **验收：**
  - 在新建的数据库上，服务以 fixture 模式启动、未配置模型时运行脚本：第 1、3、4、5 项 PASS，第 2 项 FAIL，并说明原因（未配置模型）。
  - 脚本本身不报错。

### T-9.6 E2E 字体断言 — 状态：PARTIAL（2026-10-31，Linux 未验证）

- **验证说明：** 已排除 Fallback 字体，Windows 9 项 E2E 通过；当前无 Linux 执行环境，Linux 验收尚未完成。

- **内容：** P9。
- **验收：** 在 Linux 上执行 `npx playwright test` 通过。

## M10 决策增强

### T-10.1 接口 — 状态：DONE（2026-10-31）

- **验证说明：** pytest 覆盖指定建议、非法请求、沿用/重置及双语审计哈希。

- **验收：**
  1. `adopted` 携带 `action_indices=[0,2]`：结果的 `adopted_actions` 为 O5 的第 0 条和第 2 条建议。
  2. 以下请求返回 400：
     - `action_indices` 为空
     - `action_indices` 越界
     - `action_indices` 有重复
     - `needs_detail` 不带 note
     - `needs_detail` 的 note 只有空格
  3. 沿用规则单元测试：
     - 已采纳的建议文本仍在新批次中 → 沿用原状态；
     - 已采纳的建议文本不在新批次中 → 重置为 pending。
  4. 审计摘要为「O5 · 已采纳 · 第 01、03 条」。

### T-10.2 界面 — 状态：DONE（2026-10-31）

- **验证说明：** E2E 覆盖空选禁用、采纳第 1/3 条、补充说明快捷键；截图 T-10.2-adopted.png / T-10.2-note.png。

- **验收：**
  1. 未勾选任何建议时，「采纳建议（0）」按钮禁用，按 Ctrl+Enter 只显示提示、不提交。
  2. 勾选第 1、3 条后提交：文档显示「已采纳：第 01、03 条」，最近处理表的「说明」列一致。
  3. 按 Ctrl+D 展开补充面板，在 textarea 中按 Ctrl+Enter 提交的是「需补充」，不是「采纳」。
  4. 截图。

## M11 知识库

### T-11.1 数据与同步 — 状态：DONE（2026-10-31）

- **验证说明：** pytest 验证初始 23 条、流水线后 32 条、来源变更保留编辑、恢复及只读 409。

- **验收：**
  1. 启动后共有 23 条：watch 3、rule 4、order 8、impact 8。
  2. 跑完 fixture 流水线后共有 32 条，新增 policy 8、brief 1。
  3. 编辑 `policy:2026-20511` 的中文正文后确认 DRAFT-2026-20511：
     - `source_changed=true`，正文仍是编辑后的内容；
     - 执行 restore 后，正文变为系统版本，`source_changed=false`。
  4. 对 `impact:O5` 执行 PUT 返回 409。

### T-11.2 接口与检索 — 状态：DONE（2026-10-31）

- **验证说明：** pytest 验证 301 排除检索、敏感项排除、手动条目增改删及审计。

- **验收：**
  1. `q=301 排除`、`include_sensitive=false` 时，结果包含 `watch:W_301_EXCLUSION_EXPIRY`，且不包含任何 order 或 impact 条目。
  2. 手动条目的增、改、删都正常，并都写入了审计。

### T-11.3 页面 — 状态：DONE（2026-10-31）

- **验证说明：** E2E 覆盖编辑、系统版本、恢复、来源更新和只读；截图 T-11.3*.png。

- **验收：**
  - 按 V02_SPEC §5.5 渲染页面。
  - 编辑、恢复、只读标签、「来源已更新」横幅都可以用 E2E 走通。
  - 截图。

## M12 工作台与对话

### T-12.1 对话后端 — 状态：DONE（2026-10-31）

- **验证说明：** pytest 验证引用、数字守卫、订单开关、敏感数据审计和多模态 data URL 请求。

- **验收：**
  1. 前置条件：已跑完 fixture 流水线。
  2. 问「今天有哪些需要关注的政策？」，`use_order_data=false`：
     - 回答与夹具一致；
     - citations 为 2 条；
     - `guard.ok=true`。
  3. 问「O5 为什么是红色？」，`use_order_data=true`：
     - `guard.ok=true`；
     - 写入审计 `CHAT_ORDER_DATA_SENT`。
  4. 同一问题，`use_order_data=false`：
     - `guard.ok=false`，`unknown_numbers` 为 `["2026-11-16","41.9","16,000.00","8,473.57","7,526.43"]`；
     - citations 中没有 `impact:O5`。
  5. 用 respx 检查：`complete_json` 带图片时，请求体为内容块数组，且包含 `image_url` 的 data URL。

### T-12.2 导入任务后端 — 状态：DONE（2026-10-31）

- **验证说明：** pytest 验证图片 2 行/CSV 8 行、校验失败、导入计数和审计；按 V02_SPEC §6.5 使用 PUT（任务下文 PATCH 与规格冲突）。

- **验收：**
  1. 上传 `fixtures/import/order_sheet_sample.png`：
     - 创建后状态为 `needs_consent`，`requires_model=true`；
     - consent 后状态为 `parsed`，2 行，0 错误；
     - commit 后 `imported=2`；
     - `/api/meta` 中 `pending=10`、`green=6`；
     - 审计中至少包含 `IMPORT_SENT_TO_MODEL`、`ORDERS_IMPORTED`、`RUN_CREATED` 三条。
  2. 上传 `seed/engine/orders_sample.csv`：
     - 直接为 `parsed`，`requires_model=false`，8 行；
     - commit 后 `updated=8`。
  3. 把一行的 qty 改为 0：
     - PATCH 后 errors 有 1 条；
     - commit 返回 422。

### T-12.3 工作台页面 — 状态：DONE（2026-10-31）

- **验证说明：** E2E 覆盖首页、默认关闭开关、问答和引用跳转；截图 T-12.3*.png。

- **验收：**
  1. `/` 显示工作台，导航第一项为「工作台」。
  2. 开关默认关闭；开启后显示提示。
  3. 夹具问题的回答和引用标签正确显示；点击引用标签跳转到知识库对应条目。
  4. 截图。

### T-12.4 导入预览界面 — 状态：DONE（2026-10-31）

- **验证说明：** E2E 覆盖确认、2 行预览、错误禁用、修复和 10 张订单卡；截图 T-12.4*.png。

- **验收：**
  1. 上传图片后弹出确认弹窗，文字按 V02_SPEC §6.5。
  2. 确认后显示 2 行预览。
  3. 把一个单元格改错后，「确认导入」按钮禁用；改回后可以导入。
  4. 导入后收件箱显示 10 张卡片。
  5. 截图。

## M13 中英文

### T-13.1 前端字典与切换 — 状态：DONE（2026-10-31）

- **验证说明：** E2E 验证 7 项英文导航、刷新持久化、html lang、切回中文；截图 T-13.1-*.png。

- **验收：**
  1. 切到 EN 后，导航依次为 Workbench、Risk Inbox、Policy Brief、Knowledge Base、Rule Review、Agent Pipeline、Model Access。
  2. 刷新页面后仍为 EN；`<html lang="en">`。
  3. 切回中文后，T-14.1 中的全部中文文字断言通过。

### T-13.2 后端双语 — 状态：DONE（2026-10-31）

- **验证说明：** pytest 验证 golden 模板唯一匹配/中文还原、O5 英文、日报英文和双语审计哈希。

- **验收：**
  1. `engine/i18n.py` 的测试：golden 中全部字符串都能唯一匹配一个模板，且用 zh 模板渲染后与原文完全相同。
  2. `lang=en` 时，O5：
     - `actions[0]` 以 `If entry happens on or before 2026-11-09, the rate is 16.9% (currently 41.9%)` 开头；
     - `risk_reasons` 为 `Loss after recalculation`；
     - 第二层的 label 为 `Section 301 list`。
  3. `lang=en` 的日报结论以 `There is no new rate change in force today.` 开头。
  4. 新写入的审计事件同时有 `summary_zh` 和 `summary_en`，且哈希链能复算。

### T-13.3 分诊与抽取 v2 — 状态：DONE（2026-10-31）

- **验证说明：** pytest 验证英文分诊/摘要进入日报和知识库，respx 检查 v2 提示词字段。

- **验收：**
  1. 夹具中的 `one_line_en` / `summary_en` 能出现在 `lang=en` 的日报和知识库中。
  2. 用 respx 检查：v2 提示词包含英文字段要求。

### T-13.4 英文文案审阅清单 — 状态：DONE（2026-10-31）

- **验证说明：** 已生成 docs/i18n-review.md，覆盖前端 272 项与后端英文模板，附重新生成脚本。

- **验收：** 生成 `docs/i18n-review.md`，覆盖 `en.ts` 和后端 en 模板中的全部字符串。

## M14 收尾

### T-14.1 E2E 扩展 — 状态：DONE（2026-10-31）

- **验证说明：** 9 项 Playwright 通过：旧 2 项与新增 7 项，覆盖全部指定业务路径。

- **验收：** 在 v0.1 两项 E2E 之外，新增以下路径并全部通过：
  1. 采纳指定建议。
  2. 填写补充说明。
  3. 编辑并恢复知识库条目。
  4. 工作台夹具问答。
  5. 导入图片订单。
  6. 切换到 EN 再切回。

### T-14.2 文档与版本 — 状态：DONE（2026-10-31）

- **验证说明：** VERSION/包版本 0.2.0，README、RELEASE_NOTES、ACCEPTANCE_V02 及双语清单已同步。

- **内容：**
  - `VERSION` 改为 `0.2.0`。
  - `docs/RELEASE_NOTES.md` 增加 v0.2 一节。
  - README 更新：工作台、知识库、语言切换、冒烟测试。
- **验收：** 文档与实现一致。
