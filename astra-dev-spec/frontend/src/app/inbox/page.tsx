"use client";
import { t } from "@/i18n/runtime";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconCheck, IconX, IconInfoCircle } from "@tabler/icons-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { animate, createSpring } from "animejs";
import { api, type Schema } from "@/lib/api";
import { modifierLabel } from "@/lib/platform";
import { Shell, useMeta } from "@/components/shell";
import { ImportDialog } from "@/components/import-dialog";
import {
  ImpactCard,
  ImpactDocument,
  RuleCheckPanel,
  StampButton,
  AuditLog,
  DecisionHistoryTable,
  PipelineFlow,
  CriticalEventsPanel,
  SearchBox,
  Tabs,
  PrimaryButton,
  ErrorBanner,
  EmptyPanel,
  LoadingPanel,
} from "@/components/ui";
gsap.registerPlugin(useGSAP);
function Inbox() {
  const [actionIndices, setActionIndices] = useState<number[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [hint, setHint] = useState(false);
  useEffect(() => {
    if (!hint) return;
    document.querySelector(".action-list")?.scrollIntoView({ block: "center", behavior: "smooth" });
    const timer = setTimeout(() => setHint(false), 2000);
    return () => clearTimeout(timer);
  }, [hint]);
  const router = useRouter(),
    params = useSearchParams(),
    cache = useQueryClient(),
    meta = useMeta();
  const [tab, setTab] = useState("all"),
    [group, setGroup] = useState("all"),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [importOpen, setImportOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null),
    queueRef = useRef<HTMLDivElement>(null),
    documentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(id);
  }, [search]);
  const riskFilter = tab === "urgent" ? "&risk=红,橙&decision=pending" : "";
  const cards = useQuery({
    queryKey: ["impacts", tab, group, query],
    queryFn: () =>
      api<Schema<"ImpactCard">[]>(
        `/impacts?incoterm_group=${group}&q=${encodeURIComponent(query)}${riskFilter}`,
      ),
  });
  const selected = params.get("order") || cards.data?.[0]?.order_id;
  const detail = useQuery({
    queryKey: ["impact", selected],
    enabled: !!selected && !!cards.data?.length,
    queryFn: () => api<Schema<"ImpactDetail">>(`/impacts/${selected}`),
  });
  const events = useQuery({
    queryKey: ["audit", 6],
    queryFn: () => api<Schema<"AuditEvent">[]>("/audit?limit=6"),
  });
  const history = useQuery({
    queryKey: ["decisions", 4],
    queryFn: () => api<Schema<"DecisionRow">[]>("/decisions?limit=4"),
  });
  const watches = useQuery({
    queryKey: ["watches"],
    queryFn: () => api<Schema<"WatchItem">[]>("/watch-items"),
  });
  const pipeline = useQuery({
    queryKey: ["pipeline"],
    queryFn: () => api<Schema<"PipelineRun">>("/pipeline/runs/latest"),
  });
  const recalc = useMutation({
    mutationFn: () => api("/runs", { method: "POST" }),
    onSuccess: () => cache.invalidateQueries(),
  });
  const decision = useMutation({
    mutationFn: (kind: Schema<"DecisionRequest">["decision"]) =>
      api(`/impacts/${selected}/decision`, {
        method: "POST",
        body: JSON.stringify({
          decision: kind,
          ...(kind === "adopted"
            ? { action_indices: actionIndices }
            : kind === "needs_detail"
              ? { note }
              : {}),
        }),
      }),
    onSuccess: () => {
      setNoteOpen(false);
      setNote("");
      cache.invalidateQueries();
    },
  });
  const [previousSelected, setPreviousSelected] = useState(selected);
  if (previousSelected !== selected) {
    setPreviousSelected(selected);
    setActionIndices([]);
    setNoteOpen(false);
    setNote("");
    setHint(false);
  }
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input,textarea,select,[contenteditable],[role=dialog]")) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (!selected || importOpen || decision.isPending || !detail.data) return;
      const kind =
        e.key === "Enter"
          ? "adopted"
          : e.key === "Backspace"
            ? "dismissed"
            : e.key.toLowerCase() === "d"
              ? "needs_detail"
              : null;
      if (kind) {
        e.preventDefault();
        if (kind === "needs_detail") setNoteOpen(true);
        else if (kind === "adopted" && !actionIndices.length) setHint(true);
        else decision.mutate(kind);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, importOpen, decision, detail.data, actionIndices]);
  useGSAP(
    () => {
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
        gsap.fromTo(
          ".impact-card",
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.06 },
        );
    },
    { scope: queueRef, dependencies: [cards.data] },
  );
  useGSAP(
    () => {
      if (!detail.data || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        ".impact-document",
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.15 },
      );
      gsap.fromTo(
        ".stamp-btn",
        { autoAlpha: 0, x: 30 },
        { autoAlpha: 1, x: 0, duration: 0.5, ease: "power3.out", stagger: 0.08, delay: 0.3 },
      );
    },
    { scope: documentRef, dependencies: [selected, !!detail.data] },
  );
  useEffect(() => {
    if (
      !detail.data ||
      detail.data.decision === "pending" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const stamp = documentRef.current?.querySelector(".big-stamp"),
      doc = documentRef.current?.querySelector(".impact-document");
    if (stamp)
      animate(stamp, {
        scale: [3, 1],
        rotate: [-15, -6],
        opacity: [0, 0.88],
        duration: 600,
        ease: createSpring({ stiffness: 90, damping: 8, mass: 1.4 }),
      });
    if (doc) animate(doc, { x: [0, -8, 6, -4, 2, 0], duration: 600, ease: "outElastic(1, .5)" });
  }, [detail.data?.decision, decision.submittedAt, detail.data]);
  return (
    <Shell
      title={t("订单风险收件箱")}
      actions={
        <>
          <SearchBox ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} />
          <PrimaryButton onClick={() => setImportOpen(true)}>{t("+ 导入订单")}</PrimaryButton>
        </>
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "all", label: t("全部") },
          { id: "urgent", label: t("紧急"), count: meta.data?.counts.urgent },
        ]}
      />
      <div className="inbox-layout">
        <section className="queue" ref={queueRef}>
          <div className="queue-toolbar">
            <div>
              {[
                ["all", t("全部")],
                ["ddp", "DDP"],
                ["non_ddp", t("非 DDP")],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={`filter-button ${group === id ? "active" : ""}`}
                  onClick={() => setGroup(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <PrimaryButton disabled={recalc.isPending} onClick={() => recalc.mutate()}>
              {t("重新计算")}
            </PrimaryButton>
          </div>
          <p className="sort-label font-mono">{t("排序：预计入境 最近优先 ↓")}</p>
          {cards.isPending && <LoadingPanel />}
          {cards.error && <ErrorBanner error={cards.error} retry={() => cards.refetch()} />}
          {recalc.error && <ErrorBanner error={recalc.error} />}
          <div className="queue-cards">
            {cards.data?.map((v) => (
              <ImpactCard
                key={v.order_id}
                value={v}
                selected={v.order_id === selected}
                onClick={() =>
                  router.replace(`/inbox?order=${encodeURIComponent(v.order_id)}`, { scroll: false })
                }
              />
            ))}
          </div>
        </section>
        <section className="detail-pane grid-doc">
          {cards.data?.length === 0 ? (
            <EmptyPanel>{t("暂无订单，请先导入 CSV")}</EmptyPanel>
          ) : (
            <>
              {detail.isPending && <LoadingPanel />}
              {detail.error && <ErrorBanner error={detail.error} />}
              {decision.error && <ErrorBanner error={decision.error} />}
              {detail.data && (
                <div className="document-layout" ref={documentRef}>
                  <ImpactDocument
                    value={detail.data}
                    actionHint={hint}
                    selected={actionIndices}
                    onToggle={(i) =>
                      setActionIndices((current) =>
                        current.includes(i)
                          ? current.filter((v) => v !== i)
                          : [...current, i].sort((a, b) => a - b),
                      )
                    }
                  />
                  <aside className="document-actions">
                    <p className="label-mono label-zh">{t("决策")}</p>
                    <StampButton
                      tone="ok"
                      icon={<IconCheck />}
                      shortcut={`${modifierLabel()} Enter`}
                      disabled={decision.isPending || !actionIndices.length}
                      onClick={() => decision.mutate("adopted")}
                    >
                      {t("采纳建议（{n}）", { n: actionIndices.length })}
                    </StampButton>
                    <StampButton
                      tone="bad"
                      icon={<IconX />}
                      shortcut={`${modifierLabel()} Backspace`}
                      disabled={decision.isPending}
                      onClick={() => decision.mutate("dismissed")}
                    >
                      {t("不处理")}
                    </StampButton>
                    <StampButton
                      tone="warn"
                      icon={<IconInfoCircle />}
                      shortcut={`${modifierLabel()} D`}
                      disabled={decision.isPending}
                      onClick={() => setNoteOpen(true)}
                    >
                      {t("需补充")}
                    </StampButton>
                    {noteOpen && (
                      <section className="note-panel brut-sm">
                        <label htmlFor="detail-note">{t("补充说明（必填）")}</label>
                        <textarea
                          rows={4}
                          id="detail-note"
                          value={note}
                          maxLength={500}
                          autoFocus
                          onChange={(e) => setNote(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              e.stopPropagation();
                              setNoteOpen(false);
                            }
                            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              if (note.trim() && !decision.isPending) decision.mutate("needs_detail");
                            }
                          }}
                        />
                        <small>{note.length}/500</small>
                        <PrimaryButton
                          disabled={!note.trim() || decision.isPending}
                          onClick={() => decision.mutate("needs_detail")}
                        >
                          {t("提交")}
                        </PrimaryButton>
                        <button onClick={() => setNoteOpen(false)}>{t("取消")}</button>
                      </section>
                    )}
                    <RuleCheckPanel checks={detail.data.checks} />
                  </aside>
                </div>
              )}
            </>
          )}
          {events.data && <AuditLog events={events.data} />}
          {history.data && <DecisionHistoryTable decisions={history.data} />}
          <PipelineFlow pipeline={pipeline.data} drafts={meta.data?.counts.drafts_pending} />
          {watches.data && <CriticalEventsPanel items={watches.data} />}
        </section>
      </div>
      {importOpen && <ImportDialog close={() => setImportOpen(false)} />}
    </Shell>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<LoadingPanel />}>
      <Inbox />
    </Suspense>
  );
}
