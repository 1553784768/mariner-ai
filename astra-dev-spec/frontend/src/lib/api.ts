import type { components } from "./api-types";
export type Schema<K extends keyof components["schemas"]> = components["schemas"][K];
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
export class ApiFailure extends Error { constructor(public status: number, message: string, public details?: unknown) { super(message); } }
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/api${path}`, { ...init, headers: { ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...init?.headers } });
  const body = await response.json();
  if (!response.ok) throw new ApiFailure(response.status, body.error?.message || "服务器内部错误", body.error?.details);
  return body;
}
