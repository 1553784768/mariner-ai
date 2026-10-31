"use client";
import { t } from "@/i18n/runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, ApiFailure, type Schema } from "@/lib/api";
import { legalLabels, draftLabels } from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import { Shell } from "@/components/shell";
import { EmptyPanel, ErrorBanner, KeyValueGrid, LoadingPanel, Tag } from "@/components/ui";
export default function Page() {
  const [selected, setSelected] = useState("");
  const dates = useQuery({ queryKey: ["brief-dates"], queryFn: () => api<Schema<"BriefDate">[]>("/briefs") });
  const day = selected || dates.data?.[0]?.date;
  const brief = useQuery({
    queryKey: ["brief", day],
    enabled: !!day,
    queryFn: () => api<Schema<"Brief">>(`/briefs/${day}`),
  });
  const kinds: Record<string, string> = {
    policy: t("政策"),
    expiry: t("到期"),
    watch: t("观察"),
    preview_alert: t("预警（尚未正式发布）"),
  };
  const error = dates.error || brief.error;
  return (
    <Shell title={t("政策日报")}>
      <div className="single-page grid-doc">
        <div className="single-content">
          {dates.isPending && <LoadingPanel />}
          {error && !(error instanceof ApiFailure && error.status === 404) && <ErrorBanner error={error} />}
          {dates.data?.length === 0 && <EmptyPanel>{t("还没有日报")}</EmptyPanel>}
          {day && (
            <label>
              {t("日期")}{" "}
              <select
                className="date-select brut-sm font-mono"
                value={day}
                onChange={(e) => setSelected(e.target.value)}
              >
                {dates.data?.map((d) => (
                  <option key={d.date}>{d.date}</option>
                ))}
              </select>
            </label>
          )}
          {day && brief.isPending && <LoadingPanel />}
          {brief.data && (
            <article className="paper-document brut-lg">
              <h2>
                {t("美国关税政策日报 ·")}
                {brief.data.date}
              </h2>
              <p className="conclusion">{brief.data.conclusion}</p>
              <div data-testid="brief-items">
                {brief.data.items.map((item, i) => (
                  <section className="brief-item" key={`${item.source_url}-${i}`}>
                    <div className="tags">
                      <Tag>{item.legal_status ? legalLabels[item.legal_status] : t("待读全文")}</Tag>
                      <Tag tone="canvas">{kinds[item.kind]}</Tag>
                      {!item.confirmed && <Tag>{t("待确认")}</Tag>}
                      {item.draft_status && item.draft_status !== "draft" && (
                        <Tag>{draftLabels[item.draft_status]}</Tag>
                      )}
                    </div>
                    <h3>{item.title}</h3>
                    {item.original_title && (
                      <p className="original-title">
                        {t("原文标题：")}
                        {item.original_title}
                      </p>
                    )}
                    {item.summary !== item.title && <p className="body-copy">{item.summary}</p>}
                    {item.affected_order_ids.length > 0 && (
                      <p className="body-copy">
                        {t("受影响订单 ·")}
                        {item.affected_order_ids.join(" · ")}
                      </p>
                    )}
                    {item.impact_usd !== null && (
                      <p className="font-mono">{formatMoney(item.impact_usd, true)}</p>
                    )}
                    {item.source_url && (
                      <a className="font-mono" href={item.source_url} target="_blank" rel="noreferrer">
                        {t("原文 ↗")}
                      </a>
                    )}
                  </section>
                ))}
              </div>
              <KeyValueGrid
                values={[
                  { label: t("订单总数"), value: brief.data.order_summary.total },
                  ...(["red", "orange", "yellow", "green"] as const).map((key, i) => ({
                    label: [t("红"), t("橙"), t("黄"), t("绿")][i],
                    value: brief.data!.order_summary[key],
                  })),
                  {
                    label: t("合计利润变化"),
                    value: formatMoney(brief.data.order_summary.profit_delta_usd, true),
                  },
                  { label: t("潜在退款"), value: formatMoney(brief.data.order_summary.refund_usd) },
                ]}
              />
            </article>
          )}
        </div>
      </div>
    </Shell>
  );
}
