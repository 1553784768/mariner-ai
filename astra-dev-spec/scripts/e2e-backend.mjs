import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, existsSync, unlinkSync } from "node:fs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backend = resolve(root, "backend"), data = resolve(backend, "data");
mkdirSync(data, { recursive: true });
for (const name of ["e2e.db", "e2e.db-wal", "e2e.db-shm"]) {
  const target = resolve(data, name);
  if (dirname(target) !== data) throw new Error("Invalid test database path");
  if (existsSync(target)) unlinkSync(target);
}
const python = resolve(backend, process.platform === "win32" ? ".venv/Scripts/python.exe" : ".venv/bin/python");
const child = spawn(python, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001"], { cwd: backend, stdio: "inherit", windowsHide: true, env: { ...process.env, DATABASE_URL: "sqlite:///./data/e2e.db", COLLECTOR_MODE: "fixture", LOCAL_PORT: "8001", CORS_ORIGINS: "http://127.0.0.1:3001", AS_OF_DATE: "2026-10-31", SCHEDULER_ENABLED: "false" } });
for (const event of ["SIGINT", "SIGTERM"]) process.on(event, () => child.kill());
child.on("exit", code => process.exit(code || 0));
