"use client";
import { t } from "@/i18n/runtime";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { IconPaperclip, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiFailure, type Schema } from "@/lib/api";
import type { ChatMessage, Conversation } from "@/lib/v02";
import { useRouter, useSearchParams } from "next/navigation";
import type { ConversationSummary } from "@/lib/v02";
import { legalLabels } from "@/lib/labels";
import { useI18n } from "@/i18n";
import { Shell, useMeta } from "@/components/shell";
import { ImportPreview } from "@/components/import-preview";
import { ErrorBanner, LoadingPanel, PrimaryButton, Tag } from "@/components/ui";

function Workbench() {
  const { lang } = useI18n(),
    cache = useQueryClient(),
    meta = useMeta();
  const [text, setText] = useState(""),
    [orderData, setOrderData] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);
  const attachment = useRef<HTMLInputElement>(null);
  const router = useRouter(),
    params = useSearchParams();
  const selected = params.get("c");
  const conversations = useQuery({
    queryKey: ["conversations", lang],
    queryFn: () => api<ConversationSummary[]>("/chat/conversations?limit=50"),
  });
  const conversation = useQuery({
    queryKey: ["conversation", selected || "latest"],
    queryFn: async () => {
      try {
        return await api<Conversation>(
          `/chat/conversations/${selected ? encodeURIComponent(selected) : "latest"}`,
        );
      } catch (error) {
        if (!selected && error instanceof ApiFailure && error.status === 404) return null;
        throw error;
      }
    },
  });
  useEffect(() => {
    if (!selected && conversation.data) {
      cache.setQueryData(["conversation", conversation.data.id], conversation.data);
      router.replace(`/?c=${encodeURIComponent(conversation.data.id)}`, { scroll: false });
    }
  }, [selected, conversation.data, cache, router]);
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
  const append = (cid: string, messages: ChatMessage[]) => {
    cache.setQueryData<Conversation>(["conversation", cid], (current) =>
      current ? { ...current, messages: [...current.messages, ...messages] } : current,
    );
    cache.invalidateQueries({ queryKey: ["conversations"] });
  };
  const send = useMutation({
    mutationFn: ({ cid, question }: { cid: string; question: string }) =>
      api<{ user: ChatMessage; assistant: ChatMessage }>(`/chat/conversations/${cid}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: question, lang, use_order_data: orderData }),
      }),
    onSuccess: (value, variables) => {
      append(variables.cid, [value.user, value.assistant]);
      setText("");
    },
  });
  const fresh = useMutation({
    mutationFn: () => api<{ id: string }>("/chat/conversations", { method: "POST" }),
    onSuccess: (value) => {
      cache.setQueryData(["conversation", value.id], { ...value, messages: [] });
      cache.invalidateQueries({ queryKey: ["conversations"] });
      router.replace(`/?c=${value.id}`, { scroll: false });
      setText("");
    },
  });
  const remove = useMutation({
    mutationFn: (cid: string) => api(`/chat/conversations/${cid}`, { method: "DELETE" }),
    onSuccess: (_, cid) => {
      const list = conversations.data || [];
      const position = list.findIndex((v) => v.id === cid);
      const remaining = list.filter((v) => v.id !== cid);
      cache.setQueryData(["conversations", lang], remaining);
      cache.removeQueries({ queryKey: ["conversation", cid] });
      if (conversation.data?.id === cid) {
        const next = remaining[position] || remaining[0];
        cache.setQueryData(["conversation", "latest"], null);
        router.replace(next ? `/?c=${next.id}` : "/", { scroll: false });
      }
      cache.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
  const upload = useMutation({
    mutationFn: async ({ file, cid }: { file: File; cid: string }) => {
      if (file.size > 10 * 1024 * 1024) throw new Error(t("文件过大（上限 10 MB）"));
      const data = new FormData();
      data.append("file", file);
      data.append("conversation_id", cid);
      return api<{ messages: ChatMessage[] }>("/import-jobs", { method: "POST", body: data });
    },
    onSuccess: (value, variables) => append(variables.cid, value.messages),
    onError: (error) => setUploadError(error),
  });
  const pending = send.isPending || upload.isPending || fresh.isPending || remove.isPending;
  const busy = pending || !conversation.data;
  const submit = () => {
    if (text.trim() && !busy) send.mutate({ cid: conversation.data!.id, question: text.trim() });
  };
  return (
    <Shell title={t("工作台")}>
      <div className="workbench-layout grid-doc">
        <section className="chat-panel brut-lg">
          <aside className="conversation-history" aria-label={t("对话记录")}>
            <h2>{t("对话记录")}</h2>
            <button className="secondary-button brut-sm" disabled={pending} onClick={() => fresh.mutate()}>
              {t("+ 新对话")}
            </button>
            {conversations.error && <ErrorBanner error={conversations.error} />}
            {conversations.data?.length === 0 && <p>{t("还没有对话")}</p>}
            {conversations.data?.map((item) => (
              <div
                key={item.id}
                className="conversation-item"
                data-active={item.id === conversation.data?.id}
              >
                <button
                  className="conversation-select"
                  disabled={pending}
                  onClick={() => {
                    setText("");
                    router.push(`/?c=${item.id}`, { scroll: false });
                  }}
                >
                  <span>{item.title}</span>
                  <time>{new Date(item.updated_at).toLocaleString("sv-SE").slice(5, 16)}</time>
                </button>
                <button
                  className="conversation-delete"
                  aria-label={`${t("删除")} ${item.title}`}
                  disabled={pending}
                  onClick={() => {
                    if (confirm(t("确定删除这段对话吗？"))) remove.mutate(item.id);
                  }}
                >
                  <IconTrash size={16} />
                </button>
              </div>
            ))}
          </aside>
          <div className="chat-main">
            <div className="section-heading">
              <h2>{t("工作台")}</h2>
            </div>
            {(fresh.error || remove.error) && <ErrorBanner error={(fresh.error || remove.error)!} />}
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
              {conversation.data?.messages.map((message, index) => (
                <article
                  key={message.id}
                  className={`chat-message chat-${message.role}${message.error ? " chat-error" : ""}`}
                >
                  {message.guard && !message.guard.ok && (
                    <p className="source-banner tone-bad">
                      {t("回答中有知识库里找不到的数字：")}
                      {message.guard.unknown_numbers.join("、")}
                      {t("，请以订单影响单为准")}
                    </p>
                  )}
                  {!message.import_job_id && <p>{message.text}</p>}
                  {message.error && (
                    <button
                      className="secondary-button brut-sm"
                      disabled={busy}
                      onClick={() => {
                        const question = conversation
                          .data!.messages.slice(0, index)
                          .reverse()
                          .find((v) => v.role === "user")?.text;
                        if (question) send.mutate({ cid: conversation.data!.id, question });
                      }}
                    >
                      {t("重试")}
                    </button>
                  )}
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
                      upload.mutate({ file, cid: conversation.data!.id });
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

export default function Page() {
  return (
    <Suspense fallback={<LoadingPanel />}>
      <Workbench />
    </Suspense>
  );
}
