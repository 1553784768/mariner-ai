"use client";
import { t } from "@/i18n/runtime";
import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconCheck, IconX, IconInfoCircle } from "@tabler/icons-react";
import { api, type Schema } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { changeLabels, draftLabels, legalLabels, statusLabels, validationLabels } from "@/lib/labels";
import { Shell } from "@/components/shell";
import {
  EmptyPanel,
  ErrorBanner,
  IdCornerTag,
  LoadingPanel,
  SectionTitle,
  StampButton,
  Tag,
  stateTone,
} from "@/components/ui";
function highlighted(value: Schema<"RuleDraftDetail">) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const h of [...value.highlights].sort((a, b) => a.start - b.start)) {
    if (h.start < cursor) continue;
    parts.push(value.source_text.slice(cursor, h.start));
    parts.push(
      <mark key={`${h.start}-${h.field}`} title={h.field}>
        {value.source_text.slice(h.start, h.end)}
      </mark>,
    );
    cursor = h.end;
  }
  parts.push(value.source_text.slice(cursor));
  return parts;
}
export default function Page() {
  const [selected, setSelected] = useState(""),
    cache = useQueryClient();
  const cards = useQuery({ queryKey: ["drafts"], queryFn: () => api<Schema<"RuleDraft">[]>("/rule-drafts") });
  const id = selected || cards.data?.[0]?.id;
  const detail = useQuery({
    queryKey: ["draft", id],
    enabled: !!id,
    queryFn: () => api<Schema<"RuleDraftDetail">>(`/rule-drafts/${id}`),
  });
  const review = useMutation({
    mutationFn: (action: Schema<"ReviewRequest">["action"]) =>
      api(`/rule-drafts/${id}/review`, { method: "POST", body: JSON.stringify({ action }) }),
    onSuccess: () => cache.invalidateQueries(),
  });
  const draft = detail.data,
    disabled = review.isPending || !draft || ["approved", "rejected"].includes(draft.status);
  return (
    <Shell title={t("规则审核")}>
      <div className="inbox-layout">
        <section className="queue">
          <div className="queue-cards">
            {cards.isPending && <LoadingPanel />}
            {cards.error && <ErrorBanner error={cards.error} />}
            {cards.data?.length === 0 && <EmptyPanel>{t("暂无待确认的规则草稿")}</EmptyPanel>}
            {cards.data?.map((d) => (
              <button
                key={d.id}
                className="impact-card brut-card"
                data-selected={id === d.id}
                data-draft={d.id}
                onClick={() => setSelected(d.id)}
              >
                <IdCornerTag tone={stateTone[d.status]}>{d.source_document_number}</IdCornerTag>
                <div className="card-heading">
                  <h2>{d.title}</h2>
                  <div className="card-money">
                    <strong className="font-mono">
                      {d.impact_preview ? formatMoney(d.impact_preview.profit_delta_usd, true) : "—"}
                    </strong>
                    <p className="label-mono label-zh">{t("预估影响 · USD")}</p>
                  </div>
                </div>
                <div className="tags" style={{ marginTop: 16 }}>
                  <Tag>{legalLabels[d.legal_status]}</Tag>
                  <Tag>{changeLabels[d.change.change_type]}</Tag>
                  <Tag tone={stateTone[d.status]}>{draftLabels[d.status]}</Tag>
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="detail-pane grid-doc">
          {detail.error && <ErrorBanner error={detail.error} />}
          {id && detail.isPending && <LoadingPanel />}
          {review.error && <ErrorBanner error={review.error} />}
          {draft && (
            <div className="document-layout">
              <article className="impact-document brut-lg">
                <p className="label-mono">{draft.source_document_number}</p>
                <h2 className="review-title">{draft.title}</h2>
                <p className="body-copy">
                  {t("原文标题：")}
                  {draft.original_title}
                </p>
                <div className="tags" style={{ margin: "20px 0" }}>
                  <Tag tone={stateTone[draft.status]}>{draftLabels[draft.status]}</Tag>
                  <Tag>{legalLabels[draft.legal_status]}</Tag>
                </div>
                <SectionTitle>{t("原文")}</SectionTitle>
                <div className="source-text font-mono" data-testid="source-text">
                  {highlighted(draft)}
                </div>
                <a href={draft.source_url} target="_blank" rel="noreferrer" className="font-mono source-link">
                  {t("原文 ↗")}
                </a>
              </article>
              <aside className="document-actions">
                <StampButton
                  tone="ok"
                  disabled={disabled || draft.validation.some((v) => v.status === "fail")}
                  icon={<IconCheck />}
                  onClick={() => review.mutate("approve")}
                >
                  {t("确认规则")}
                </StampButton>
                <StampButton
                  tone="bad"
                  disabled={disabled}
                  icon={<IconX />}
                  onClick={() => review.mutate("reject")}
                >
                  {t("驳回")}
                </StampButton>
                <StampButton
                  tone="warn"
                  disabled={disabled}
                  icon={<IconInfoCircle />}
                  onClick={() => review.mutate("needs_detail")}
                >
                  {t("需补充")}
                </StampButton>
                <section className="review-checks brut-sm">
                  <SectionTitle>{t("校验结果")}</SectionTitle>
                  {draft.validation.map((v) => (
                    <div className="check-row" key={v.check}>
                      <span>
                        {v.check} {validationLabels[v.check]}
                        {v.message !== "通过" &&
                          v.message !== "Pass" &&
                          !["注意", "Attention", "不通过", "Fail", "不适用", "Not applicable"].includes(
                            v.message,
                          ) && <small>{v.message}</small>}
                      </span>
                      <b className={`text-${stateTone[v.status] || "ink"}`}>{statusLabels[v.status]}</b>
                    </div>
                  ))}
                </section>
              </aside>
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
