"use client";
import { t } from "@/i18n/runtime";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Schema } from "@/lib/api";
import type { ImportJob } from "@/lib/v02";
import { useI18n } from "@/i18n";
import { ErrorBanner, PrimaryButton, Tag } from "./ui";

const columns = [
  "order_id",
  "product",
  "hts10",
  "incoterm",
  "qty",
  "unit_price_usd",
  "customs_value_usd",
  "entry_date",
];
export function ImportPreview({ id }: { id: string }) {
  const cache = useQueryClient();
  const { lang } = useI18n();
  const [all, setAll] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>[] | null>(null);
  const [result, setResult] = useState<Schema<"ImportResult"> | null>(null);
  const job = useQuery({ queryKey: ["import-job", id], queryFn: () => api<ImportJob>(`/import-jobs/${id}`) });
  const settings = useQuery({
    queryKey: ["llm-settings"],
    queryFn: () => api<Schema<"LlmSettings">>("/settings/llm"),
  });
  const operation = useMutation({
    mutationFn: ({ action, rows }: { action: string; rows?: Record<string, string>[] }) =>
      api<ImportJob & Schema<"ImportResult">>(`/import-jobs/${id}/${action}`, {
        method: action === "rows" ? "PUT" : "POST",
        ...(rows ? { body: JSON.stringify({ rows }) } : {}),
      }),
    onSuccess: (value, args) => {
      if (args.action === "commit") setResult(value);
      else cache.setQueryData(["import-job", id], value);
      setDraft(null);
      cache.invalidateQueries();
    },
  });
  const value = job.data;
  if (!value) return job.error ? <ErrorBanner error={job.error} /> : <p>{t("识别中…")}</p>;
  const rows = draft || value.rows;
  const fields = all ? Array.from(new Set(rows.flatMap((row) => Object.keys(row)))) : columns;
  const busy = operation.isPending;
  return (
    <section className="import-preview brut-sm" data-testid="import-preview">
      <strong>{value.filename}</strong>
      {operation.error && <ErrorBanner error={operation.error} />}
      {value.status === "needs_consent" && (
        <div className="modal-backdrop">
          <section
            className="import-modal brut-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`consent-${id}`}
          >
            <h2 id={`consent-${id}`}>{t("发送文件给模型？")}</h2>
            <p>
              {t(
                "「{filename}」的内容将发送给已配置的模型 {model}{endpoint}用于识别订单。文件可能包含客户、价格和成本信息。",
                {
                  filename: value.filename,
                  model: settings.data?.configured ? value.model : t("内置夹具"),
                  endpoint: settings.data?.configured
                    ? lang === "zh"
                      ? `（${settings.data.base_url}）`
                      : ` (${settings.data.base_url})`
                    : "",
                },
              )}
            </p>
            <div className="button-row">
              <PrimaryButton disabled={busy} onClick={() => operation.mutate({ action: "consent" })}>
                {t("发送并识别")}
              </PrimaryButton>
              <button disabled={busy} onClick={() => operation.mutate({ action: "cancel" })}>
                {t("取消")}
              </button>
            </div>
          </section>
        </div>
      )}
      {value.status === "failed" && (
        <p role="alert">{value[`notes_${lang}`] || t("未配置模型，无法识别该文件。可改用 CSV 模板导入。")}</p>
      )}
      {value.status === "parsed" && (
        <>
          <button className="secondary-button brut-sm" onClick={() => setAll(!all)} aria-pressed={all}>
            {t("显示全部字段")}
          </button>
          <div className="preview-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {fields.map((field) => (
                    <th key={field}>{field}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    {fields.map((field) => {
                      const error = value.errors.find(
                        (e) => e.row === index + (value.kind === "csv" ? 2 : 1) && e.field === field,
                      );
                      return (
                        <td key={field}>
                          <input
                            disabled={busy}
                            aria-label={`${index + 1}-${field}`}
                            title={error?.message}
                            aria-invalid={!!error}
                            value={row[field] ?? ""}
                            onChange={(e) =>
                              setDraft(
                                rows.map((r, i) => (i === index ? { ...r, [field]: e.target.value } : r)),
                              )
                            }
                            onBlur={() => {
                              if (draft) operation.mutate({ action: "rows", rows: draft });
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {value.errors.map((error, index) => (
            <p className="text-bad" key={index}>
              {error.row} · {error.field} · {error.message}
            </p>
          ))}
          <p>{value[`notes_${lang}`]}</p>
          <div className="button-row">
            <PrimaryButton
              className="tone-ok"
              disabled={busy || !!draft || !!value.errors.length || !rows.length}
              onClick={() => operation.mutate({ action: "commit" })}
            >
              {t("确认导入")}
            </PrimaryButton>
            <button disabled={busy} onClick={() => operation.mutate({ action: "cancel" })}>
              {t("取消")}
            </button>
          </div>
        </>
      )}
      {value.status === "imported" && (
        <Tag tone="ok">
          {result ? (
            <>
              {t("已导入")}
              {result.imported}
              {t("行，更新")}
              {result.updated}
              {t("行")}
            </>
          ) : (
            t("已导入")
          )}
        </Tag>
      )}
      {value.status === "cancelled" && <Tag>{t("取消")}</Tag>}
    </section>
  );
}
