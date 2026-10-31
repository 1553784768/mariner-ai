"use client";
import { t } from "@/i18n/runtime";
import Link from "next/link";
import { useRef, useState } from "react";
import { IconPaperclip } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiFailure, type Schema } from "@/lib/api";
import type { ChatMessage, Conversation } from "@/lib/v02";
import { legalLabels } from "@/lib/labels";
import { useI18n } from "@/i18n";
import { Shell, useMeta } from "@/components/shell";
import { ImportPreview } from "@/components/import-preview";
import { ErrorBanner, PrimaryButton, Tag } from "@/components/ui";

export default function Page() {
  const { lang } = useI18n(),
    cache = useQueryClient(),
    meta = useMeta();
  const [text, setText] = useState(""),
    [orderData, setOrderData] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);
  const attachment = useRef<HTMLInputElement>(null);
  const conversation = useQuery({
    queryKey: ["conversation"],
    queryFn: async () => {
      try {
        return await api<Conversation>("/chat/conversations/latest");
      } catch (error) {
        if (!(error instanceof ApiFailure) || error.status !== 404) throw error;
        const value = await api<{ id: string }>("/chat/conversations", { method: "POST" });
        return { ...value, messages: [] };
      }
    },
  });
  const settings = useQuery({
    queryKey: ["llm-settings"],
    queryFn: () => api<Schema<"LlmSettings">>("/settings/llm"),
  });
  const brief = useQuery({
    queryKey: ["latest-brief"],
    queryFn: async () => {
      try {
        return await api<Schema<"Brief">>("/briefs/latest");
      } catch (error) {
        if (error instanceof ApiFailure && error.status === 404) return null;
        throw error;
      }
    },
  });
  const watches = useQuery({
    queryKey: ["watches"],
    queryFn: () => api<Schema<"WatchItem">[]>("/watch-items"),
  });
  const append = (messages: ChatMessage[]) =>
    cache.setQueryData<Conversation>(["conversation"], (current) =>
      current ? { ...current, messages: [...current.messages, ...messages] } : current,
    );
  const send = useMutation({
    mutationFn: () =>
      api<{ user: ChatMessage; assistant: ChatMessage }>(
        `/chat/conversations/${conversation.data!.id}/messages`,
        { method: "POST", body: JSON.stringify({ text: text.trim(), lang, use_order_data: orderData }) },
      ),
    onSuccess: (value) => {
      append([value.user, value.assistant]);
      setText("");
    },
  });
  const fresh = useMutation({
    mutationFn: () => api<{ id: string }>("/chat/conversations", { method: "POST" }),
    onSuccess: (value) => {
      cache.setQueryData(["conversation"], { ...value, messages: [] });
      setText("");
    },
  });
  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 10 * 1024 * 1024) throw new Error(t("文件过大（上限 10 MB）"));
      const data = new FormData();
      data.append("file", file);
      data.append("conversation_id", conversation.data!.id);
      return api<{ messages: ChatMessage[] }>("/import-jobs", { method: "POST", body: data });
    },
    onSuccess: (value) => append(value.messages),
    onError: (error) => setUploadError(error),
  });
  const busy = send.isPending || upload.isPending || fresh.isPending || !conversation.data;
  const submit = () => {
    if (text.trim() && !busy) send.mutate();
  };
  return (
    <Shell title={t("工作台")}>
      <div className="workbench-layout grid-doc">
        <section className="chat-panel brut-lg">
          <div className="section-heading">
            <h2>{t("工作台")}</h2>
            <button className="secondary-button brut-sm" disabled={busy} onClick={() => fresh.mutate()}>
              {t("新对话")}
            </button>
          </div>
          {!meta.data?.llm_configured && (
            <p className="source-banner tone-warn-soft brut-sm">
              {t("未配置模型：只能回答内置示例问题。")}
              <Link href="/settings">{t("去配置 →")}</Link>
            </p>
          )}
          {(conversation.error || send.error || uploadError) && (
            <ErrorBanner error={(conversation.error || send.error || uploadError)!} />
          )}
          <div className="chat-messages" aria-live="polite">
            {conversation.data?.messages.map((message) => (
              <article key={message.id} className={`chat-message chat-${message.role}`}>
                {message.guard && !message.guard.ok && (
                  <p className="source-banner tone-bad">
                    {t("回答中有知识库里找不到的数字：")}
                    {message.guard.unknown_numbers.join("、")}
                    {t("，请以订单影响单为准")}
                  </p>
                )}
                {!message.import_job_id && <p>{message.text}</p>}
                {!!message.citations.length && (
                  <div className="tags">
                    <span>{t("引用")}</span>
                    {message.citations.map((citation) => (
                      <Link
                        className="tag brut-sm"
                        key={citation.id}
                        href={`/knowledge?id=${encodeURIComponent(citation.id)}`}
                      >
                        {citation.title}
                      </Link>
                    ))}
                  </div>
                )}
                {message.import_job_id && <ImportPreview id={message.import_job_id} />}
              </article>
            ))}
            {send.isPending && <p role="status">{t("思考中…")}</p>}
          </div>
          <div className="chat-composer">
            <label>
              <input type="checkbox" checked={orderData} onChange={(e) => setOrderData(e.target.checked)} />
              {t("对话可使用订单数据")}
            </label>
            {orderData && (
              <p className="source-banner tone-warn-soft">
                {t("开启后，检索到的订单和影响单内容会发送给模型")}
                {settings.data?.model || t("内置夹具")}
              </p>
            )}
            <textarea
              placeholder={t("输入问题，或上传订单文件…")}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <div className="button-row">
              <input
                ref={attachment}
                type="file"
                hidden
                accept=".csv,.xlsx,.pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadError(null);
                    upload.mutate(file);
                  }
                  e.target.value = "";
                }}
              />
              <button
                aria-label="attachment"
                className="secondary-button brut-sm"
                disabled={busy}
                onClick={() => attachment.current?.click()}
              >
                <IconPaperclip />
              </button>
              <PrimaryButton disabled={busy || !text.trim()} onClick={submit}>
                {t("发送")}
              </PrimaryButton>
            </div>
          </div>
        </section>
        <aside className="workbench-context">
          <section className="paper-document brut">
            <h2>{t("风险收件箱")}</h2>
            <div className="tags">
              <Tag>
                {meta.data?.counts.pending ?? 0}
                {t("待处理")}
              </Tag>
              <Tag tone="bad">
                {meta.data?.counts.red ?? 0}
                {t("红")}
              </Tag>
              <Tag tone="warn">
                {meta.data?.counts.urgent ?? 0}
                {t("紧急")}
              </Tag>
            </div>
            <Link href="/inbox">{t("风险收件箱 →")}</Link>
          </section>
          <section className="paper-document brut">
            <h2>{t("政策日报")}</h2>
            <p>{brief.data?.conclusion}</p>
            <Link href="/brief">{t("查看日报 →")}</Link>
          </section>
          <section className="paper-document brut">
            <h2>{t("临界事件")}</h2>
            {watches.data?.slice(0, 3).map((item) => (
              <p key={item.id}>
                <Tag>{legalLabels[item.legal_status]}</Tag> {item.title}
              </p>
            ))}
          </section>
        </aside>
      </div>
    </Shell>
  );
}
