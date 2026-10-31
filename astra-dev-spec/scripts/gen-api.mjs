import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const frontend = resolve(dirname(fileURLToPath(import.meta.url)), "../frontend");
const result = spawnSync(process.execPath, [
  resolve(frontend, "node_modules/openapi-typescript/bin/cli.js"),
  process.env.OPENAPI_URL || "http://127.0.0.1:8000/openapi.json",
  "-o", resolve(frontend, "src/lib/api-types.ts"),
], { stdio: "inherit", windowsHide: true });
process.exit(result.status ?? 1);
