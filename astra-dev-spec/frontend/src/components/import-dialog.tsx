"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiFailure, type Schema } from "@/lib/api";
import { ErrorBanner, PrimaryButton } from "./ui";
export function ImportDialog({ close }: { close: () => void }) {
  const [file, setFile] = useState<File | null>(null), cache = useQueryClient();
  const upload = useMutation({ mutationFn: () => { const body = new FormData(); body.append("file", file!); return api<Schema<"ImportResult">>("/orders/import", { method: "POST", body }); }, onSuccess: () => cache.invalidateQueries() });
  const errors = upload.error instanceof ApiFailure && Array.isArray(upload.error.details) ? upload.error.details as { row: number; field: string; message: string }[] : [];
  return <div className="modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="import-title" className="import-modal brut-lg"><h2 id="import-title">导入订单 CSV</h2><label>选择文件<input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} /></label>{upload.error && <ErrorBanner error={upload.error} />}{errors.map((e, i) => <p key={i} className="import-errors">第 {e.row} 行 · {e.field} · {e.message}</p>)}{upload.data && <p>已导入 {upload.data.imported} 行，更新 {upload.data.updated} 行</p>}<div className="button-row"><PrimaryButton disabled={!file || upload.isPending} onClick={() => upload.mutate()}>上传</PrimaryButton><button className="secondary-button brut-sm" onClick={close}>取消</button></div></section></div>;
}
