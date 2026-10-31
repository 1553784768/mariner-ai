# v0.2 新增和修改的夹具

| 文件 | 说明 |
|---|---|
| `llm/triage.json` | 在 v0.1 基础上为 23 条记录增加 `one_line_en` |
| `llm/extract.json` | 在 v0.1 基础上为 2 条记录增加 `summary_en` |
| `llm/chat.json` | 3 个对话问题的固定回答；按「问题去掉首尾空白并转小写」查找 |
| `llm/import.json` | 按文件字节的 sha256 查找；对应 `import/order_sheet_sample.png`，内含 2 行订单（ORD-101、ORD-102） |
| `import/order_sheet_sample.png` | 用于多模态导入测试的订单表图片（示例数据） |

把本文件的内容并入 `backend/fixtures/README.md`。
