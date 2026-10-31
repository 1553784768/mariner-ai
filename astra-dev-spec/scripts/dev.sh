#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
if [[ "${1:-}" == "--fixture" ]]; then
  export NEXT_FONT_GOOGLE_MOCKED_RESPONSES="$(node "$project_root/scripts/prepare-test-fonts.cjs")"
  export COLLECTOR_MODE=fixture AS_OF_DATE=2026-10-31 SCHEDULER_ENABLED=false
fi
if [[ ! -x "$project_root/backend/.venv/bin/python" || ! -f "$project_root/frontend/node_modules/next/dist/bin/next" ]]; then
  echo 'Install dependencies as described in README.md first.' >&2
  exit 1
fi
backend_pid=''
frontend_pid=''
cleanup() {
  [[ -z "$frontend_pid" ]] || kill "$frontend_pid" 2>/dev/null || true
  [[ -z "$backend_pid" ]] || kill "$backend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
(cd "$project_root/backend" && exec .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000) &
backend_pid=$!
(cd "$project_root/frontend" && exec node node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3000) &
frontend_pid=$!
echo 'Mariner AI: http://127.0.0.1:3000/inbox'
wait "$backend_pid" "$frontend_pid"
