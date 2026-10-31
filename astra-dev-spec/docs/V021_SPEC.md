# V021_SPEC.md

本文件定义 v0.2.1 的修复范围。与其他文档冲突时，以本文件为准。版本号改为 `0.2.1`。

## 1. 写操作在响应前提交（高）

**已复现的问题：** 新建对话后立即发消息，偶发返回 404「未找到对话」。7 轮测试中出现 3 次。

**原因：** `session_dep` 在 `yield` 之后才提交事务，而 FastAPI 0.162 是在响应发出之后才执行这段代码，所以紧接着的下一个请求读不到刚写入的数据。仅把提交挪到依赖内部无效；在接口里 return 之前显式调用 `session.commit()` 后，问题消失（已验证）。

**要求：**

- 所有 POST、PUT、DELETE 接口在 return 之前调用 `session.commit()`。如果接口在 commit 之后还要读数据，就在 commit 之后再组装返回值。
- 流水线后台线程有自己的会话，不受影响。

## 2. 对话检索（高）

**已复现的问题：** 在已经跑过 fixture 流水线的库里，提问「今日政策变化」「你好」「今天有哪些需要关注的政策？」「What changed today?」，传给模型的上下文都是 0 条。模型调用本身是成功的，只是没有拿到任何资料。

**原因：** V02_SPEC §5.4 的检索按整句短语匹配。中文问句没有空格，整句被当成一个词，几乎匹配不到任何条目。

**新算法：** 替换 V02_SPEC §5.4 的「检索规则」和 §6.4 第 1 步。知识库页面的搜索也改用这个算法，函数名为 `retrieve(question, prev_question, include_sensitive, order_ids, k)`。

1. **候选条目：** 取未删除的条目（§6）；`include_sensitive=false` 时排除 sensitive 条目。
2. **分词：** 把 `question + " " + prev_question` 转成小写后切分：
   - 拉丁字母和数字：用正则 `[a-z0-9][a-z0-9.\-]*` 提取，保留长度 ≥ 2 且不在英文停用词表中的词。
   - 连续汉字（`[一-鿿]+`）：切成相邻的两字组合，去掉中文停用词表中的组合。
   - 结果去重，保留首次出现的顺序。
3. **打分：** 每个词在条目标题中出现记 3 分，否则在正文中出现记 1 分，再把所有词的分数相加。标题指 `title_zh + " " + title_en`，正文指 `body_zh + " " + body_en`，都转成小写。
4. **排序：** 只保留得分 > 0 的条目，按得分降序排列；得分相同时按 id 升序。
5. **当前态势兜底：** 问题（只看本次问题，不含上一问）包含时间意图词，或者第 4 步没有结果时，按以下顺序组合：
   1. 日期最新的一条 brief 条目
   2. 第 4 步的结果
   3. 尚未出现的 watch 条目，按 `/api/watch-items` 的顺序
6. **订单条目置顶：** `include_sensitive=true` 时，对问题中出现的每个订单号（与 `orders.order_id` 精确匹配，不区分大小写，前后不能紧挨字母或数字），把 `impact:{id}`、`order:{id}` 放到最前面。
7. **截断：** 按 id 去重后取前 k 条，对话中 k = 8。

**词表：**

| 词表 | 内容 |
|---|---|
| 中文停用词 | 什么 哪些 怎么 为什 一下 请问 你好 您好 有没 没有 可以 这个 那个 我们 你们 一个 是否 需要 现在 目前 情况 相关 今天 今日 最新 最近 当天 |
| 英文停用词 | what is the are of to in on for and any there which why how does do today latest recent changed change what's a an me about please hi hello |
| 时间意图词 | 今天 今日 最新 最近 当天 日报 本周 today latest recent brief this week |

**`prev_question`：** 取本对话中上一条用户消息的原文，没有时为空字符串。

## 3. 对话上下文与提示词（中）

**user 消息的 JSON 新增字段：**

| 字段 | 内容 |
|---|---|
| `as_of` | 今天 |
| `order_data_enabled` | 即 `use_order_data` |
| `mentioned_orders` | 问题中出现的订单号；不管开关是否打开都要识别 |
| `history` | 本对话最近 6 条消息，每条只含 `{role, text}`，不含引用和上下文 |

**提示词：** 新建 `chat_v2.md`，内容如下：

```
You are the assistant inside Mariner AI, a local tool that tracks how U.S. tariff policy changes affect export orders.
Answer in the language given by "lang" (zh = Simplified Chinese, en = English). "as_of" is today's date.
"history" holds the previous turns of this conversation; use it to understand follow-up questions.
For greetings or questions about what you can do, reply briefly without the context: you answer questions about tariff policy, rules, the daily brief and, when enabled, specific orders; you can also import order files.
For factual questions, use only the context entries. If they do not answer the question, say what the context does cover and suggest a more specific question.
If "mentioned_orders" is not empty and "order_data_enabled" is false, tell the user to turn on "Allow order data in chat" (对话可使用订单数据) to ask about those orders.
Copy every number, date and amount exactly as it appears in the context or history; never calculate or estimate new numbers.
List the ids of the context entries you used in "citations".
You cannot change orders, decisions, rules or settings; if asked, tell the user which page to use.
Return only a JSON object that matches the schema.
```

**数字守卫：** 判断来源时，在「问题 + 上下文」之外加入 `history` 中各条消息的文本。

**夹具模式：** 行为不变。

## 4. 模型调用失败时保留消息（中）

- 模型调用失败时，接口仍返回 200 和 `{user, assistant}`，不再返回 502。
- 用户消息照常保存。
- 再保存一条助手消息：`text` 用 V02_SPEC §7.6 的四类本地化错误原因，`ChatMessage` 新增字段 `error: boolean`，此时为 true。
- 前端用 `bad` 底白字显示这类消息，并带一个「重试」按钮。点击后用同一问题重新发送，生成一组新的用户消息和助手消息。

## 5. 对话历史（中）

**接口：**

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/chat/conversations?limit=50` | 返回 `[{id, title, created_at, updated_at, message_count}]`，按 `updated_at` 倒序排列。`title` 取第一条用户消息的前 30 个字符，没有消息时为「新对话」/「New chat」。`updated_at` 取最后一条消息的时间，没有消息时取 `created_at` |
| GET | `/api/chat/conversations/{id}` | 返回 `{id, created_at, messages}` |
| DELETE | `/api/chat/conversations/{id}` | 删除对话及其消息，返回 `{deleted: true}`。关联的导入任务保留。写审计 `CHAT_DELETED`，摘要为「{id} · 删除对话」 |

`/latest` 保留，行为不变。

**界面：** 对话面板 C27 的左侧加一栏「对话记录」，宽 240px，用 2px 黑色右边框和面板主体分开。

- 顶部按钮「+ 新对话」，原来面板右上角的「新对话」按钮移除。
- 列表每项两行：标题（14px）和 mono 10px 的「MM-DD HH:mm」。
- 当前对话用 `canvas` 底色加 3px 边框标出。
- 鼠标悬停时显示 `IconTrash` 按钮，点击后用浏览器 confirm 弹出「确定删除这段对话吗？」，确认后删除。
- 当前对话写进 URL `/?c={id}`；没有这个参数时打开最近的对话。
- 删除当前对话后，打开列表中的下一个；列表为空时显示「还没有对话」。

## 6. 知识库删除（中）

**数据：** `kb_entries` 新增 `deleted`（默认 false）和 `deleted_at` 两个字段。

**接口：**

| 方法 | 路径 | 说明 |
|---|---|---|
| DELETE | `/api/kb/{id}` | 手动条目：物理删除（与现在相同）。其他类型：把 `deleted` 设为 true 并记下 `deleted_at`，返回 `{deleted: true}`。写审计 `KB_DELETED` |
| POST | `/api/kb/{id}/undelete` | 把 `deleted` 设为 false，并立即对这条做一次同步：未编辑过的语言改用系统内容。返回 KbEntry。写审计 `KB_UNDELETED`，摘要为「{id} · 恢复删除」 |
| GET | `/api/kb?deleted=true` | 只列出已删除的条目；不带这个参数时排除已删除条目 |

**同步规则：** `sync_kb()` 遇到已删除的条目，仍然更新它的 `auto_*` 字段，但不改变 `deleted`，也不会把它当作新条目重新创建。

**影响范围：** 已删除条目不出现在列表、检索和对话上下文中。删除不影响订单、规则、日报和关税计算。

**界面：**

- 所有条目的标题右侧都显示「删除」按钮（`brut-sm` 白底红字）。
- 确认文字：
  - 手动条目：「确定删除这条知识吗？」
  - 其他条目：「删除后，这条内容不再出现在知识库列表和对话中，可在「已删除」中恢复。不影响订单、规则和关税计算。确定删除吗？」
- 类型筛选的最后加一项「已删除」。
- 查看已删除的条目时，顶部显示 `warn-soft` 横幅「已删除」，并带「恢复」按钮。

## 7. 新增文案

| 中文 | 英文 |
|---|---|
| 对话记录 | Conversations |
| + 新对话 | + New chat |
| 新对话 | New chat |
| 还没有对话 | No conversations yet |
| 确定删除这段对话吗？ | Delete this conversation? |
| 重试 | Retry |
| 已删除 | Deleted |
| 恢复 | Restore |
| 删除后，这条内容不再出现在知识库列表和对话中，可在「已删除」中恢复。不影响订单、规则和关税计算。确定删除吗？ | After deletion this entry no longer appears in the knowledge base list or in chat. You can restore it from "Deleted". Orders, rules and duty calculations are not affected. Delete it? |
| 审计动作：CHAT_DELETED 删除对话 · KB_UNDELETED 恢复知识 | CHAT_DELETED Delete chat · KB_UNDELETED Restore knowledge |
