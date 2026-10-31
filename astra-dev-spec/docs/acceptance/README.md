# Portable acceptance evidence

`screenshots/` contains copies of the final local acceptance screenshots. Filenames match the task IDs recorded in `../TASKS.md` and `../ACCEPTANCE_REPORT_FOR_CLAUDE.md`.

`logs/` contains the saved Playwright, production build, clean startup and latest background startup verification outputs. Earlier Ruff, pytest, lint and typecheck results were observed in the development terminal; separate logs were not retained for those commands.

The original generated artifacts remain ignored under `artifacts/`. Screenshots reflect different stages of the test workflow; compare their task IDs and operation states before comparing counts.
