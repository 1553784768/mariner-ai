# v0.2 交接

1. 把本目录中的文件复制到仓库根目录，同名文件直接覆盖：
   - `AGENTS.md`
   - `docs/V02_SPEC.md`、`docs/TASKS_V02.md`、`docs/engine_text_templates.json`
   - `backend/fixtures/llm/` 下的 `triage.json`、`extract.json`、`chat.json`、`import.json`
   - `backend/fixtures/import/order_sheet_sample.png`
2. 在 Codex 中粘贴下面这段提示词：

```
请先阅读 AGENTS.md，然后按 docs/TASKS_V02.md 从 T-9.0 开始依次完成任务。
v0.2 的规格见 docs/V02_SPEC.md，冲突时以它为准。
遇到文档没写明、且属于 AGENTS.md「不确定的事不自主决策」范围的事项，写进 docs/QUESTIONS.md，并跳过被阻塞的部分。
每完成一个里程碑（M9–M14），汇报以下三项：完成的任务、截图路径、新增的 Q 编号。
```
