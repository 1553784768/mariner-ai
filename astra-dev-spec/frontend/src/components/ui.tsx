"use client";
import { t } from "@/i18n/runtime";
import Image from "next/image";
import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import {
  IconSearch,
  IconClock,
  IconShieldCheck,
  IconBulb,
  IconListDetails,
  IconArchive,
  IconAlertTriangle,
  IconGitMerge,
  IconArrowNarrowRight,
  IconTrendingUp,
  IconSquareCheck,
} from "@tabler/icons-react";
import { formatMoney, formatPercent, formatTime } from "@/lib/format";
import { auditLabels, checkLabels, decisionLabels, statusLabels, agentLabels } from "@/lib/labels";
import type { Schema } from "@/lib/api";
import { modifierLabel } from "@/lib/platform";

export const riskTone: Record<string, string> = { 红: "bad", 橙: "warn", 黄: "warn-soft", 绿: "ok" };
export const stateTone: Record<string, string> = {
  adopted: "ok",
  dismissed: "bad",
  needs_detail: "warn",
  approved: "ok",
  rejected: "bad",
  draft: "warn-soft",
  pass: "ok",
  warn: "warn",
  fail: "bad",
  succeeded: "ok",
  failed: "bad",
  running: "warn",
  partial: "warn-soft",
  skipped_no_fixture: "warn-soft",
};
export function CountBadge({ children }: { children: ReactNode }) {
  return <span className="count-badge font-mono">{children}</span>;
}
export function Tag({ children, tone = "paper" }: { children: ReactNode; tone?: string }) {
  return <span className={`tag tone-${tone}`}>{children}</span>;
}
export function BrandBlock({ release = "—" }: { release?: string }) {
  return (
    <div className="brand">
      <div className="brand-logo brut-sm">
        <Image src="/logo.png" width={38} height={38} alt="Mariner AI" priority />
      </div>
      <div>
        <strong className="font-display">Mariner AI</strong>
        <p className="label-mono">
          {t("v0.2.1 · 税则")}
          {release}
        </p>
      </div>
    </div>
  );
}
export function SidebarNavItem({
  href,
  active,
  icon,
  children,
  count,
  hint,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
  count?: number;
  hint?: string;
}) {
  return (
    <Link href={href} className="nav-item" aria-current={active ? "page" : undefined}>
      {icon}
      <span>{children}</span>
      {count !== undefined && <CountBadge>{count}</CountBadge>}
      {hint && <small className="label-mono label-zh">{hint}</small>}
    </Link>
  );
}
export function IdCornerTag({ children, tone }: { children: ReactNode; tone: string }) {
  return <span className={`id-corner font-mono tone-${tone}`}>{children}</span>;
}
export function ChainDots({ nodes }: { nodes: { key: string; state: string }[] }) {
  const glyph: Record<string, string> = {
    done: "✓",
    warn: "!",
    pending: t("人"),
    needs_detail: "?",
    todo: "·",
  };
  return (
    <div className="chain-dots">
      {nodes.map((node, i) => (
        <span className="chain-part" key={node.key}>
          {i > 0 && <span className="chain-line" />}
          <span
            title={node.key}
            className={[
              "chain-node",
              `tone-${node.state === "done" ? "ok" : node.state === "todo" ? "paper" : "warn"}`,
              node.state === "todo" ? "opacity-50" : "",
            ].join(" ")}
          >
            {glyph[node.state]}
          </span>
        </span>
      ))}
    </div>
  );
}
export function ImpactCard({
  value,
  selected,
  onClick,
}: {
  value: Schema<"ImpactCard">;
  selected: boolean;
  onClick: () => void;
}) {
  const c = value.countdown;
  const countdown =
    c.kind === "entered"
      ? t("已入境")
      : c.kind === "rule_boundary"
        ? t("规则边界 {p0}天", { p0: c.days })
        : (c.days ?? 0) < 0
          ? t("已过入境日")
          : t("入境 {p0}天", { p0: c.days });
  return (
    <button
      type="button"
      className="impact-card brut-card"
      data-order={value.order_id}
      data-selected={selected}
      onClick={onClick}
    >
      <IdCornerTag tone={riskTone[value.risk_level]}>{value.order_id}</IdCornerTag>
      <div className="card-heading">
        <h2>{value.product}</h2>
        <div className="card-money">
          <strong
            className={[
              "font-mono",
              value.profit_delta_usd < 0 ? "text-bad" : value.profit_delta_usd > 0 ? "text-ok" : "",
            ].join(" ")}
          >
            {formatMoney(value.profit_delta_usd, true)}
          </strong>
          <p className="label-mono label-zh">{t("利润变化 · USD")}</p>
        </div>
      </div>
      <p className="card-subtitle font-mono">
        HTS {value.hts10} · {value.incoterm}
        {t("· 预计入境")}
        {value.entry_date.slice(5)}
      </p>
      <div className="tags">
        <Tag tone={riskTone[value.risk_level]}>{t(value.risk_level)}</Tag>
        <Tag>{value.incoterm}</Tag>
        <Tag tone={c.days === null || c.days > 7 ? "paper" : c.days < 0 ? "bad" : "warn"}>
          <IconClock size={12} />
          {countdown}
        </Tag>
        {value.tag && (
          <Tag>
            <IconTrendingUp size={12} />
            <span className="text-ok">{t("利好")}</span>
          </Tag>
        )}
      </div>
      <div className="card-footer">
        <div className="channel">
          <span className="channel-box font-mono">{value.channel === "b2b" ? "B" : "E"}</span>
          <div>
            <b>{value.channel === "b2b" ? "B2B" : t("电商")}</b>
            <p className="label-mono label-zh">
              {t("进口商")}
              {value.importer_of_record === "seller" ? t("卖方") : t("买方")}
            </p>
          </div>
        </div>
        <ChainDots nodes={value.chain} />
      </div>
    </button>
  );
}
export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`primary-button brut btn-press ${className}`}>
      {children}
    </button>
  );
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {items.map((item) => (
        <button
          role="tab"
          aria-selected={item.id === value}
          className={item.id === value ? "tab-active" : ""}
          key={item.id}
          onClick={() => onChange(item.id)}
        >
          {item.label}
          {item.count !== undefined && <span className="font-mono">{item.count}</span>}
        </button>
      ))}
    </div>
  );
}
export const SearchBox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function SearchBox(props, ref) {
    return (
      <div className="search brut-sm">
        <IconSearch size={18} />
        <input ref={ref} placeholder={t("搜索订单号、品名、HS 编码…")} {...props} />
        <kbd>{modifierLabel()} K</kbd>
      </div>
    );
  },
);
export function SidebarStatCard({ today }: { today: Schema<"Today"> }) {
  return (
    <div className="sidebar-stat brut">
      <p className="label-mono label-zh">{t("今日已处理")}</p>
      <p>
        <strong className="font-mono">{today.processed}</strong>
        <span>
          / {today.total}
          {t("单")}
        </span>
      </p>
      <div className="progress">
        {(["adopted", "dismissed", "needs_detail"] as const).map((kind) => (
          <span
            key={kind}
            className={`tone-${stateTone[kind]}`}
            style={{ width: `${today.total ? (today[kind] / today.total) * 100 : 0}%` }}
          />
        ))}
      </div>
    </div>
  );
}
export function TextField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="text-field">
      <span className="label-mono label-zh">{label}</span>
      <input className="brut-sm" {...props} />
    </label>
  );
}
export function LoadingPanel() {
  return (
    <div className="state-panel grid-paper" role="status">
      {t("加载中…")}
    </div>
  );
}
export function EmptyPanel({ children }: { children: ReactNode }) {
  return <div className="state-panel empty-panel">{children}</div>;
}
export function ErrorBanner({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div className="state-panel brut tone-bad" role="alert">
      {error.message}
      {retry && <button onClick={retry}>{t("重试")}</button>}
    </div>
  );
}
export function SectionTitle({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <h3 className="section-title">
      {icon}
      {children}
    </h3>
  );
}
export function KeyValueGrid({ values }: { values: { label: string; value: ReactNode }[] }) {
  return (
    <div className="key-values">
      {values.map((v) => (
        <div key={v.label}>
          <p className="label-mono label-zh">{v.label}</p>
          <div>{v.value}</div>
        </div>
      ))}
    </div>
  );
}
export function LayerTable({ value }: { value: Schema<"ImpactDetail"> }) {
  return (
    <div className="layer-table-scroll">
      <table className="data-table font-mono" data-testid="layers">
        <thead>
          <tr>
            {[t("层"), t("第99章税号"), t("税率"), t("关税额")].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {value.layers.map((l) => (
            <tr key={l.id}>
              <td>{l.label}</td>
              <td>{l.heading}</td>
              <td>{formatPercent(l.rate_pct)}</td>
              <td>{formatMoney(l.duty_usd)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>
              {t("基准关税（")}
              {formatPercent(value.rate_baseline_user_pct)}）
            </td>
            <td>{formatMoney(value.duty_baseline_usd)}</td>
          </tr>
          <tr>
            <td colSpan={3}>{t("新关税")}</td>
            <td>{formatMoney(value.duty_new_usd)}</td>
          </tr>
          <tr className="total-row">
            <td colSpan={3}>{t("关税增量")}</td>
            <td>{formatMoney(value.duty_delta_usd, true)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
export function ProfitTable({ value: v }: { value: Schema<"ImpactDetail"> }) {
  return (
    <table className="data-table font-mono" data-testid="profits">
      <thead>
        <tr>
          {["", t("基准"), t("重算"), t("变化")].map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{t("收入")}</td>
          <td>{formatMoney(v.revenue_usd)}</td>
          <td>{formatMoney(v.revenue_usd)}</td>
          <td>—</td>
        </tr>
        <tr>
          <td>{t("卖方成本")}</td>
          <td>{formatMoney(v.seller_cost_baseline_usd)}</td>
          <td>{formatMoney(v.seller_cost_new_usd)}</td>
          <td>{formatMoney(v.seller_cost_delta_usd, true)}</td>
        </tr>
        <tr className="total-row">
          <td>{t("利润")}</td>
          <td>{formatMoney(v.seller_profit_baseline_usd)}</td>
          <td className={v.seller_profit_new_usd < 0 ? "text-bad" : ""}>
            {formatMoney(v.seller_profit_new_usd)}
          </td>
          <td>{formatMoney(v.profit_delta_usd, true)}</td>
        </tr>
        <tr>
          <td>{t("毛利率")}</td>
          <td>{formatPercent(v.margin_baseline_pct)}</td>
          <td>{formatPercent(v.margin_new_pct)}</td>
          <td>{`${v.margin_delta_pp < 0 ? "−" : "+"}${Math.abs(v.margin_delta_pp).toFixed(1)}pp`}</td>
        </tr>
      </tbody>
    </table>
  );
}
export function ActionList({
  actions,
  selected = [],
  onToggle,
  hint = false,
}: {
  actions: string[];
  selected?: number[];
  onToggle?: (index: number) => void;
  hint?: boolean;
}) {
  return (
    <section>
      <SectionTitle icon={<IconBulb size={20} />}>{t("可执行建议")}</SectionTitle>
      {hint && <p role="status">{t("先勾选要采纳的建议")}</p>}
      <ol className="action-list">
        {actions.map((action, i) => (
          <li className={`brut-sm ${selected.includes(i) ? "action-selected" : ""}`} key={action}>
            <label>
              {onToggle && (
                <input
                  type="checkbox"
                  aria-label={`action-${i + 1}`}
                  checked={selected.includes(i)}
                  onChange={() => onToggle(i)}
                />
              )}
              <span className="font-mono">{String(i + 1).padStart(2, "0")}</span>
              <p>{action}</p>
              {selected.includes(i) && <IconSquareCheck size={20} aria-hidden="true" />}
            </label>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function ProcessChain({ value }: { value: Schema<"ImpactDetail"> }) {
  return (
    <section>
      <SectionTitle icon={<IconGitMerge size={20} />}>{t("处理链")}</SectionTitle>
      <div className="process-chain">
        {value.agent_chain.map((n, i) => (
          <span className="process-part" key={n.agent}>
            {i > 0 && <IconArrowNarrowRight size={20} />}
            <span className={`process-node process-${n.status}`}>{agentLabels[n.agent]}</span>
          </span>
        ))}
        {value.checks.some((c) => c.key === "unverified_fields" && c.status === "warn") && (
          <span className="process-node process-not_run">{t("报关行复核（含未核实字段时）")}</span>
        )}
      </div>
    </section>
  );
}
export function RuleCheckPanel({
  checks,
}: {
  checks: { key: string; status: string; value?: string | null }[];
}) {
  return (
    <section className="rule-check-panel brut-sm">
      <SectionTitle icon={<IconShieldCheck size={18} />}>{t("规则核验")}</SectionTitle>
      {checks.map((c) => (
        <div className="check-row" key={c.key}>
          <span>
            {checkLabels[c.key] || c.key}
            {c.value && <small className="font-mono">{c.value}</small>}
          </span>
          <b className={`text-${stateTone[c.status] || "ink"}`}>{statusLabels[c.status]}</b>
        </div>
      ))}
    </section>
  );
}
export function StampButton({
  tone,
  shortcut,
  icon,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone: string; shortcut?: string; icon?: ReactNode }) {
  return (
    <button className={`stamp-btn tone-${tone}`} {...props}>
      {icon}
      <span>{children}</span>
      {shortcut && <kbd>{shortcut}</kbd>}
    </button>
  );
}
export function Stamp({ decision }: { decision: Schema<"Decision">["decision"] }) {
  return decision === "pending" ? (
    <span>{t("待处理")}</span>
  ) : (
    <span
      className={`stamp text-${stateTone[decision]}`}
      style={{ transform: `rotate(${decision === "adopted" ? -2 : 2}deg)` }}
    >
      {decisionLabels[decision]}
    </span>
  );
}
export function BigStamp({ decision }: { decision: Schema<"Decision">["decision"] }) {
  return decision === "pending" ? null : (
    <div className={`big-stamp text-${stateTone[decision]}`} data-testid="big-stamp">
      {decisionLabels[decision]}
    </div>
  );
}
export function ImpactDocument({
  value,
  selected,
  onToggle,
  actionHint = false,
}: {
  value: Schema<"ImpactDetail">;
  selected?: number[];
  onToggle?: (index: number) => void;
  actionHint?: boolean;
}) {
  return (
    <article className="impact-document brut-lg">
      <BigStamp decision={value.decision} />
      {!!value.adopted_actions?.length && (
        <p className="decision-explanation">
          {t("已采纳：第 {p0} 条", {
            p0: (value.adopted_actions || []).map((a) => String(a.index + 1).padStart(2, "0")).join(t("、")),
          })}
        </p>
      )}
      {value.note && (
        <p className="decision-explanation">
          {t("补充说明：")}
          {value.note}
        </p>
      )}

      <div className="document-header">
        <h2>{t("订单影响单")}</h2>
        <p className="label-mono">
          {value.order_id} · {t("规则快照")} {value.as_of} · {value.run_id}
        </p>
        <p>
          {t("进口商：")}
          {value.importer_of_record === "seller" ? t("卖方") : t("买方")}（{value.incoterm}）
        </p>
      </div>
      <KeyValueGrid
        values={[
          {
            label: t("品名与税号"),
            value: (
              <>
                {value.product}
                <br />
                <span className="font-mono">HTS {value.hts10}</span>
              </>
            ),
          },
          {
            label: t("贸易术语"),
            value: (
              <>
                {value.incoterm} · {value.channel === "b2b" ? "B2B" : t("电商")}
                <br />
                {value.order.tariff_clause === "none"
                  ? t("无关税条款")
                  : t("关税增量我方承担 {p0}%", {
                      p0: Number(value.order.tariff_clause.split(":")[1]) * 100,
                    })}
              </>
            ),
          },
          {
            label: t("关键日期"),
            value: (
              <>
                {t("装船日")}
                {value.order.load_date}
                <br />
                {t("预计入境日")}
                {value.entry_date}
              </>
            ),
          },
        ]}
      />
      <LayerTable value={value} />
      <ProfitTable value={value} />
      <ActionList actions={value.actions} selected={selected} onToggle={onToggle} hint={actionHint} />
      <ProcessChain value={value} />
      <p className="disclaimer">
        {t("本工具不构成法律或报关意见；税号归类与最终税额以进口商/报关行申报为准。")}
      </p>
    </article>
  );
}
export function AuditLog({ events }: { events: Schema<"AuditEvent">[] }) {
  return (
    <section className="audit-panel brut">
      <div className="section-heading">
        <SectionTitle icon={<IconListDetails size={20} />}>{t("审计日志")}</SectionTitle>
        <span className="label-mono">{t("不可篡改 · SHA-256 链式")}</span>
      </div>
      <div className="audit-lines font-mono">
        {events.map((e) => (
          <p key={e.seq}>
            {formatTime(e.at, true)} {auditLabels[e.action]} {t(e.actor)} {e.summary}
          </p>
        ))}
      </div>
    </section>
  );
}
export function DecisionHistoryTable({ decisions }: { decisions: Schema<"DecisionRow">[] }) {
  return (
    <section className="history-panel brut">
      <SectionTitle icon={<IconArchive size={20} />}>{t("最近处理")}</SectionTitle>
      <table className="history-table font-mono">
        <thead>
          <tr>
            {[t("订单号"), t("品名"), t("利润变化"), t("处理人"), t("时间"), t("状态印章"), t("说明")].map(
              (h) => (
                <th key={h}>{h}</th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {decisions.map((d) => (
            <tr key={d.audit_hash}>
              <td>{d.order_id}</td>
              <td>{d.product}</td>
              <td>{formatMoney(d.profit_delta_usd, true)}</td>
              <td>{t(d.actor)}</td>
              <td>{formatTime(d.decided_at)}</td>
              <td>
                <Stamp decision={d.decision} />
              </td>
              <td title={d.note || undefined}>
                {(d.note ? (d.note.length > 40 ? d.note.slice(0, 40) + "…" : d.note) : null) ||
                  (d.adopted_actions?.length
                    ? t("第 {p0} 条", {
                        p0: d.adopted_actions.map((a) => String(a.index + 1).padStart(2, "0")).join(t("、")),
                      })
                    : "—")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
export function PipelineFlow({
  pipeline,
  drafts = 0,
}: {
  pipeline?: Schema<"PipelineRun"> | null;
  drafts?: number;
}) {
  const steps = pipeline?.steps || [];
  const collectors = steps.filter((s) => s.agent.startsWith("collector"));
  const collectState = collectors.some((s) => s.status === "failed")
    ? "failed"
    : collectors.some((s) => s.status === "skipped_no_fixture")
      ? "skipped_no_fixture"
      : collectors.length && collectors.every((s) => s.status === "succeeded")
        ? "succeeded"
        : "pending";
  const nodes = [
    { name: t("触发"), state: "canvas" },
    { name: t("采集"), state: collectState },
    ...["triage", "extract", "validate"].map((k) => ({
      name: agentLabels[k],
      state: steps.find((s) => s.agent === k)?.status || "pending",
    })),
    {
      name: drafts ? t("人工确认 · {p0} 待确认", { p0: drafts }) : t("人工确认"),
      state: drafts ? "warn" : "ok",
    },
    { name: t("计算"), state: "ok" },
    { name: t("日报"), state: steps.find((s) => s.agent === "brief")?.status || "pending" },
    { name: t("完成"), state: pipeline?.status || "pending" },
  ];
  return (
    <section className="pipeline-flow brut polka">
      <SectionTitle icon={<IconGitMerge size={20} />}>{t("智能体流水线")}</SectionTitle>
      <div>
        {nodes.map((n, i) => (
          <span className="process-part" key={n.name}>
            {i > 0 && <IconArrowNarrowRight size={18} />}
            <span
              className={[
                "flow-node brut-sm",
                `tone-${stateTone[n.state] || (["ok", "warn", "canvas"].includes(n.state) ? n.state : "paper")}`,
              ].join(" ")}
            >
              {n.name}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
export function CriticalEventsPanel({ items }: { items: Schema<"WatchItem">[] }) {
  return (
    <section className="critical-panel brut stripes-warn">
      <SectionTitle icon={<IconAlertTriangle size={20} />}>{t("临界事件")}</SectionTitle>
      <div className="critical-grid">
        {items.map((w) => (
          <article key={w.id} className={`critical-card border-${riskTone[w.severity]}`}>
            <Tag tone={riskTone[w.severity]}>{w.severity}</Tag>
            <h4>{w.title}</h4>
            <p>
              {w.affected_order_ids.length
                ? t("影响 {p0} 单 · {p1}", {
                    p0: w.affected_order_ids.length,
                    p1: w.impact_usd === null ? "暂无税率" : formatMoney(w.impact_usd, true),
                  })
                : t("暂无受影响订单")}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
