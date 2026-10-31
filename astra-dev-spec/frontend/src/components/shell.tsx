"use client";
import Image from "next/image";
import Link from "next/link";
import { t } from "@/i18n/runtime";
import { useI18n } from "@/i18n";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import {
  IconInbox,
  IconNews,
  IconFileSearch,
  IconGitMerge,
  IconPlugConnected,
  IconBook,
  IconMessageChatbot,
  IconFileText,
  IconSearch,
} from "@tabler/icons-react";
import { api, type Schema } from "@/lib/api";
import { formatTime } from "@/lib/format";
import { modifierLabel } from "@/lib/platform";
import { ErrorBanner } from "./ui";
import { APP_VERSION } from "@/lib/version";
export function useMeta() {
  return useQuery({ queryKey: ["meta"], queryFn: () => api<Schema<"Meta">>("/meta") });
}
function SidebarSearch() {
  const pathname = usePathname(),
    router = useRouter(),
    params = useSearchParams();
  const urlQuery = params.get("q") || "";
  const [input, setInput] = useState(urlQuery);
  const [previousQuery, setPreviousQuery] = useState(urlQuery);
  if (previousQuery !== urlQuery) {
    setPreviousQuery(urlQuery);
    setInput(urlQuery);
  }
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "k" &&
        !document.querySelector('[role="dialog"]')
      ) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (pathname !== "/inbox" || input === urlQuery) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (input) next.set("q", input);
      else next.delete("q");
      next.delete("order");
      router.replace(`/inbox?${next}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [input, urlQuery, pathname, router, params]);
  return (
    <div className="search-box">
      <IconSearch size={14} />
      <input
        ref={ref}
        aria-label={t("搜索订单号、品名、HS 编码…")}
        placeholder={t("搜索订单号、品名、HS 编码…")}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && pathname !== "/inbox") {
            e.preventDefault();
            router.push(`/inbox?q=${encodeURIComponent(input)}`);
          }
        }}
      />
      <kbd className="kbd font-sans">{modifierLabel()} K</kbd>
    </div>
  );
}
export function Shell({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { lang, setLang } = useI18n();
  const pathname = usePathname(),
    meta = useMeta();
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(formatTime(new Date().toISOString()));
    const initial = setTimeout(update, 0);
    const timer = setInterval(update, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);
  const links = [
    { href: "/", title: t("工作台"), icon: <IconMessageChatbot /> },
    { href: "/inbox", title: t("风险收件箱"), icon: <IconInbox />, count: meta.data?.counts.pending },
    { href: "/brief", title: t("政策日报"), icon: <IconNews /> },
    { href: "/knowledge", title: t("知识库"), icon: <IconBook /> },
    {
      href: "/review",
      title: t("规则审核"),
      icon: <IconFileSearch />,
      count: meta.data?.counts.drafts_pending,
    },
    { href: "/pipeline", title: t("智能体流水线"), icon: <IconGitMerge /> },
  ];
  const today = meta.data?.today;
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-org">
          <Image className="org-logo" src="/favicon.png" width={26} height={26} alt="" priority />
          <span className="org-name">Mariner AI</span>
          <span className="plan-badge">v{APP_VERSION}</span>
        </div>
        <div className="topbar-main">
          <div className="project-picker">
            <span className="project-mark">
              <IconFileText />
            </span>
            {t("税则 {hts_release}", { hts_release: meta.data?.hts_release || "—" })}
          </div>
          <h1 className="topbar-title">{title}</h1>
          <span className="topbar-clock">
            {t("北京时间")} {time || "—"}
          </span>
        </div>
      </header>
      <div className="layout">
        <aside className="sidebar">
          <Suspense>
            <SidebarSearch />
          </Suspense>
          <nav className="nav-list">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-item${pathname === l.href ? " active" : ""}`}
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.icon}
                <span>{l.title}</span>
                {l.count !== undefined && <span className="nav-count">{l.count}</span>}
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            {today && (
              <div className="today-card">
                <div className="today-label">{t("今日已处理")}</div>
                <div className="today-value">
                  {today.processed}
                  <small>
                    / {today.total} {t("单")}
                  </small>
                </div>
                <div className="stack-bar">
                  {(["adopted", "dismissed", "needs_detail"] as const).map((key, i) => (
                    <i
                      key={key}
                      style={{
                        width: `${today.total ? (today[key] / today.total) * 100 : 0}%`,
                        background: `var(--color-${["good", "bad", "warn"][i]})`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <Link
              className={`nav-item${pathname === "/settings" ? " active" : ""}`}
              aria-current={pathname === "/settings" ? "page" : undefined}
              href="/settings"
            >
              <IconPlugConnected />
              <span>{t("模型接入")}</span>
              <span className="nav-hint">{meta.data?.llm_configured ? t("已接入") : t("未接入")}</span>
            </Link>
            <div className="sidebar-profile">
              <span className="profile-avatar">{t("本")}</span>
              <span className="profile-name">{t("本地用户")}</span>
              <div className="segmented mini">
                <button
                  className={lang === "zh" ? "active" : ""}
                  aria-pressed={lang === "zh"}
                  onClick={() => setLang("zh")}
                >
                  {t("中")}
                </button>
                <button
                  className={lang === "en" ? "active" : ""}
                  aria-pressed={lang === "en"}
                  onClick={() => setLang("en")}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </aside>
        <main className="content">
          {actions && <div className="filter-row">{actions}</div>}
          {meta.error && <ErrorBanner error={meta.error} retry={() => meta.refetch()} />}
          {children}
        </main>
      </div>
    </div>
  );
}
