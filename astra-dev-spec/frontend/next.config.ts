import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  devIndicators: false,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  ...(process.env.MARINER_STATIC_EXPORT === "1" ? { output: "export" as const } : {}),
};
export default nextConfig;
