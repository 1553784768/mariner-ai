"use client";
import { t } from "@/i18n/runtime";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/format";
import type { KnowledgeEntry } from "@/lib/v02";
import { useI18n } from "@/i18n";
import { Shell } from "@/components/shell";
import { EmptyPanel, ErrorBanner, LoadingPanel, PrimaryButton, Tag } from "@/components/ui";

function Knowledge() {
  const { lang } = useI18n();
  const params = useSearchParams(),
    router = useRouter(),
    cache = useQueryClient();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [sensitive, setSensitive] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [system, setSystem] = useState(false);
  const [title, setTitle] = useState(""),
    [body, setBody] = useState("");
  const entries = useQuery({
    queryKey: ["kb", type, query, sensitive, lang],
    queryFn: () =>
      api<KnowledgeEntry[]>(
        `/kb?type=${type}&q=${encodeURIComponent(query)}&include_sensitive=${sensitive}&limit=200`,
      ),
  });
  const id = params.get("id") || entries.data?.[0]?.id;
  const detail = useQuery({
    queryKey: ["kb-detail", id, lang],
    enabled: !!id && !creating,
    queryFn: () => api<KnowledgeEntry>(`/kb/${encodeURIComponent(id!)}`),
  });
  const value = detail.data;
  const [previousId, setPreviousId] = useState(id);
  if (previousId !== id) {
    setPreviousId(id);
    setEditing(false);
    setSystem(false);
  }
  const mutation = useMutation({
    mutationFn: async (action: string) => {
      if (action === "create")
        return api<KnowledgeEntry>("/kb", {
          method: "POST",
          body: JSON.stringify({ [`title_${lang}`]: title, [`body_${lang}`]: body }),
        });
      return api<KnowledgeEntry>(`/kb/${encodeURIComponent(id!)}${action === "restore" ? "/restore" : ""}`, {
        method: action === "delete" ? "DELETE" : action === "restore" ? "POST" : "PUT",
        ...(action !== "delete" ? { body: JSON.stringify({ lang, title, body }) } : {}),
      });
    },
    onSuccess: (result, action) => {
      setEditing(false);
      setCreating(false);
      setSystem(false);
      if (action === "create") router.replace(`/knowledge?id=${encodeURIComponent(result.id)}`);
      if (action === "delete") router.replace("/knowledge");
      cache.invalidateQueries();
    },
  });
  const typeLabel = (key: string) =>
    ({
      policy: t("政策"),
      watch: t("观察项"),
      rule: t("规则"),
      brief: t("日报"),
      order: t("订单"),
      impact: t("影响单"),
      manual: t("手动"),
    })[key] || key;
  return (
    <Shell title={t("知识库")}>
      <div className="knowledge-layout grid-doc">
        <section className="knowledge-list">
          <input
            className="brut-sm knowledge-search"
            placeholder={t("搜索知识库…")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="knowledge-filters">
            {[
              ["", t("全部")],
              ["policy", t("政策")],
              ["watch", t("观察项")],
              ["rule", t("规则")],
              ["brief", t("日报")],
              ["order", t("订单")],
              ["impact", t("影响单")],
              ["manual", t("手动")],
            ].map(([key, label]) => (
              <button
                className={`filter-button ${type === key ? "active" : ""}`}
                key={key}
                onClick={() => setType(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <label>
            <input type="checkbox" checked={sensitive} onChange={(e) => setSensitive(e.target.checked)} />
            {t("显示订单数据")}
          </label>
          <PrimaryButton
            onClick={() => {
              setCreating(true);
              setEditing(true);
              setTitle("");
              setBody("");
            }}
          >
            {t("+ 新建条目")}
          </PrimaryButton>
          {entries.error && <ErrorBanner error={entries.error} />}
          {entries.isPending && <LoadingPanel />}
          {entries.data?.length === 0 && <EmptyPanel>{t("暂无条目")}</EmptyPanel>}
          {entries.data?.map((entry) => (
            <button
              key={entry.id}
              className="knowledge-card brut-sm"
              data-selected={entry.id === id}
              onClick={() => {
                setCreating(false);
                router.replace(`/knowledge?id=${encodeURIComponent(entry.id)}`);
              }}
            >
              <strong>{entry.title}</strong>
              <div className="tags">
                <Tag>{typeLabel(entry.source_type)}</Tag>
                {entry.edited && <Tag>{t("已编辑")}</Tag>}
                {entry.source_changed && <Tag tone="warn">{t("来源已更新")}</Tag>}
                {!entry.editable && <Tag>{t("只读")}</Tag>}
              </div>
            </button>
          ))}
        </section>
        <section className="knowledge-detail">
          {mutation.error && <ErrorBanner error={mutation.error} />}
          {detail.error && !creating && <ErrorBanner error={detail.error} />}
          {(creating || value) && (
            <article className="paper-document brut-lg">
              {value?.source_changed && !creating && (
                <div className="source-banner tone-warn-soft brut-sm">
                  {t("来源已更新，当前显示的是你编辑过的版本")}
                  <button onClick={() => setSystem(!system)}>{t("查看系统版本")}</button>
                  <button disabled={mutation.isPending} onClick={() => mutation.mutate("restore")}>
                    {t("恢复")}
                  </button>
                </div>
              )}
              {editing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    mutation.mutate(creating ? "create" : "edit");
                  }}
                >
                  <label htmlFor="knowledge-title">
                    {t("标题")}
                    <input
                      id="knowledge-title"
                      aria-label={t("标题")}
                      className="brut-sm"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </label>
                  <label htmlFor="knowledge-body">
                    {t("正文")}
                    <textarea
                      id="knowledge-body"
                      aria-label={t("正文")}
                      className="brut-sm"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      required
                      rows={12}
                    />
                  </label>
                  <div className="button-row">
                    <PrimaryButton disabled={mutation.isPending || !title.trim() || !body.trim()}>
                      {t("保存")}
                    </PrimaryButton>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setCreating(false);
                      }}
                    >
                      {t("取消")}
                    </button>
                  </div>
                </form>
              ) : (
                value && (
                  <>
                    <h2>{value[`title_${lang}`] || value.title_zh}</h2>
                    <div className="tags">
                      <Tag>{typeLabel(value.source_type)}</Tag>
                      <time className="label-mono">{formatTime(value.updated_at)}</time>
                      {value.source_type === "manual" && (
                        <button
                          disabled={mutation.isPending}
                          className="secondary-button brut-sm text-bad"
                          onClick={() => {
                            if (confirm(t("确定删除这条知识吗？"))) mutation.mutate("delete");
                          }}
                        >
                          {t("删除")}
                        </button>
                      )}
                    </div>
                    <p className="knowledge-body">{value[`body_${lang}`] || value.body_zh}</p>
                    {system && (
                      <section className="system-version brut-sm">
                        <h3>{value[`auto_title_${lang}`]}</h3>
                        <p className="knowledge-body">{value[`auto_body_${lang}`]}</p>
                      </section>
                    )}
                    {value.editable ? (
                      <div className="button-row">
                        <PrimaryButton
                          onClick={() => {
                            setTitle(value[`title_${lang}`] || "");
                            setBody(value[`body_${lang}`] || "");
                            setEditing(true);
                          }}
                        >
                          {t("编辑")}
                        </PrimaryButton>
                        {value.source_type !== "manual" && value[`edited_${lang}`] && (
                          <button disabled={mutation.isPending} onClick={() => mutation.mutate("restore")}>
                            {t("恢复系统版本")}
                          </button>
                        )}
                      </div>
                    ) : (
                      <Tag>{t("系统生成，只读")}</Tag>
                    )}
                  </>
                )
              )}
            </article>
          )}
        </section>
      </div>
    </Shell>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<LoadingPanel />}>
      <Knowledge />
    </Suspense>
  );
}
