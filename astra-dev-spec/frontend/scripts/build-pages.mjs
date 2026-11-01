import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const result = spawnSync(process.execPath, [require.resolve("next/dist/bin/next"), "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    MARINER_STATIC_EXPORT: "1",
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE ?? "",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
