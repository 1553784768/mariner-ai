"use client";
import { t } from "@/i18n/runtime";
import { useI18n } from "@/i18n";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  IconInbox,
  IconNews,
  IconFileSearch,
  IconGitMerge,
  IconPlugConnected,
  IconBook,
  IconMessageChatbot,
} from "@tabler/icons-react";
import { api, type Schema } from "@/lib/api";
import { formatTime } from "@/lib/format";
import { BrandBlock, SidebarNavItem, SidebarStatCard, Tag, ErrorBanner } from "./ui";
export function useMeta() {
  return useQuery({ queryKey: ["meta"], queryFn: () => api<Schema<"Meta">>("/meta") });
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
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
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
    {
      href: "/settings",
      title: t("模型接入"),
      icon: <IconPlugConnected />,
      hint: meta.data?.llm_configured ? t("已接入") : t("未接入"),
    },
  ];
  return (
    <div className="workspace">
      <aside className="sidebar">
        <BrandBlock release={meta.data?.hts_release} />
        <p className="workspace-label label-mono label-zh">{t("工作区")}</p>
        <nav>
          {links.map((l) => (
            <SidebarNavItem
              key={l.href}
              href={l.href}
              active={pathname === l.href}
              icon={l.icon}
              count={l.count}
              hint={l.hint}
            >
              {l.title}
            </SidebarNavItem>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {meta.data && <SidebarStatCard today={meta.data.today} />}
          <div className="user-block">
            <span>{t("本")}</span>
            {t("本地用户")}
          </div>
          <div className="language-switch brut-sm">
            <button aria-pressed={lang === "zh"} onClick={() => setLang("zh")}>
              {t("中")}
            </button>
            <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>
              EN
            </button>
          </div>
        </div>
      </aside>
      <main className="workspace-main">
        <header className="topbar">
          <div>
            <div className="heading-line">
              <h1>{title}</h1>
              {pathname === "/inbox" && meta.data && (
                <>
                  <Tag>
                    {meta.data.counts.pending}
                    {t("待处理")}
                  </Tag>
                  <Tag tone="bad">
                    {meta.data.counts.red}
                    {t("红色")}
                  </Tag>
                </>
              )}
            </div>
            <p className="font-mono time-line">
              {t("北京时间")}
              {time || "—"}
              {t("· 计算批次")}
              {meta.data?.latest_run?.id || "—"}
            </p>
          </div>
          <div className="topbar-actions">{actions}</div>
        </header>
        {meta.error && <ErrorBanner error={meta.error} retry={() => meta.refetch()} />}
        {children}
      </main>
    </div>
  );
}
