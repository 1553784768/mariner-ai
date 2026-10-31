"use client";
import { t } from "@/i18n/runtime";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiFailure, type Schema } from "@/lib/api";
import { agentLabels, statusLabels } from "@/lib/labels";
import { Shell, useMeta } from "@/components/shell";
import { AuditLog, ErrorBanner, PipelineFlow, PrimaryButton, Tag, stateTone } from "@/components/ui";
export default function Page() {
  const [id, setId] = useState("latest"),
    cache = useQueryClient(),
    meta = useMeta();
  const pipeline = useQuery({
    queryKey: ["pipeline", id],
    queryFn: () => api<Schema<"PipelineRun">>(`/pipeline/runs/${id}`),
    refetchInterval: (query) => (query.state.data?.status === "running" ? 2000 : false),
  });
  const audit = useQuery({
    queryKey: ["audit", 20, pipeline.data?.status],
    queryFn: () => api<Schema<"AuditEvent">[]>("/audit?limit=20"),
  });
  const run = useMutation({
    mutationFn: () => api<Schema<"PipelineRun">>("/pipeline/runs", { method: "POST" }),
    onSuccess: (value) => {
      cache.setQueryData(["pipeline", value.id], value);
      setId(value.id);
      cache.invalidateQueries({ queryKey: ["meta"] });
    },
  });
  const busy = run.isPending || pipeline.data?.status === "running";
  useEffect(() => {
    if (pipeline.data && pipeline.data.status !== "running") {
      cache.invalidateQueries({ queryKey: ["meta"] });
      cache.invalidateQueries({ queryKey: ["drafts"] });
      cache.invalidateQueries({ queryKey: ["brief-dates"] });
    }
  }, [pipeline.data, cache]);
  return (
    <Shell
      title={t("智能体流水线")}
      actions={
        <PrimaryButton disabled={busy} onClick={() => run.mutate()}>
          {t("立即运行")}
        </PrimaryButton>
      }
    >
      <div className="single-page grid-doc pipeline-page">
        {run.error && <ErrorBanner error={run.error} />}
        {pipeline.error && !(pipeline.error instanceof ApiFailure && pipeline.error.status === 404) && (
          <ErrorBanner error={pipeline.error} />
        )}
        <PipelineFlow pipeline={pipeline.data} drafts={meta.data?.counts.drafts_pending} />
        {pipeline.data && (
          <div className="paper-document brut-lg">
            <div className="tags">
              <Tag tone={stateTone[pipeline.data.status]}>{statusLabels[pipeline.data.status]}</Tag>
              <Tag>{pipeline.data.trigger === "manual" ? t("手动") : t("每日 07:30")}</Tag>
              <span className="label-mono">{pipeline.data.id}</span>
            </div>
            <table className="data-table font-mono" data-testid="pipeline-steps">
              <thead>
                <tr>
                  {[t("智能体"), t("状态"), t("输入"), t("输出"), t("跳过"), t("错误"), t("耗时")].map(
                    (h) => (
                      <th key={h}>{h}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {pipeline.data.steps.map((s) => (
                  <tr key={s.agent} data-agent={s.agent}>
                    <td>{agentLabels[s.agent]}</td>
                    <td>
                      <Tag tone={stateTone[s.status]}>{statusLabels[s.status]}</Tag>
                    </td>
                    <td>{s.counts.input}</td>
                    <td>{s.counts.output}</td>
                    <td>{s.counts.skipped}</td>
                    <td>
                      {s.counts.errors}
                      {s.message && <p className="step-error">{s.message}</p>}
                    </td>
                    <td>
                      {s.started_at && s.finished_at
                        ? `${new Date(s.finished_at).getTime() - new Date(s.started_at).getTime()} ms`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {audit.data && <AuditLog events={audit.data} />}
      </div>
    </Shell>
  );
}
