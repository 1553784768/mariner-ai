import { t } from "@/i18n/runtime";
import { notFound } from "next/navigation";
import {
  BrandBlock,
  Tag,
  ChainDots,
  Stamp,
  BigStamp,
  LoadingPanel,
  EmptyPanel,
  ErrorBanner,
} from "@/components/ui";
import { formatMoney } from "@/lib/format";
export default function Page() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main className="component-gallery grid-doc">
      <BrandBlock />
      <h1 className="font-display">Mariner AI</h1>
      <p className="font-display">{t("Archivo · 订单风险收件箱")}</p>
      <p>{t("Hanken Grotesk · 风险收件箱")}</p>
      <p className="font-mono">{t("Space Mono · 2026-10-31 · 中文")}</p>
      <div className="tags">
        {([t("红"), t("橙"), t("黄"), t("绿")] as const).map((r, i) => (
          <Tag key={r} tone={["bad", "warn", "warn-soft", "ok"][i]}>
            {r}
          </Tag>
        ))}
      </div>
      <ChainDots
        nodes={["done", "warn", "pending", "needs_detail", "todo"].map((state) => ({ state, key: state }))}
      />
      <div className="gallery-stamps">
        {(["adopted", "dismissed", "needs_detail"] as const).map((d) => (
          <Stamp key={d} decision={d} />
        ))}
      </div>
      <div className="font-mono gallery-money">
        {formatMoney(-16000, true)}
        <br />
        {formatMoney(1500, true)}
      </div>
      <LoadingPanel />
      <EmptyPanel>{t("暂无订单，请先导入 CSV")}</EmptyPanel>
      <ErrorBanner error={new Error(t("请求参数不合法"))} />
      <div className="gallery-big-stamp">
        <BigStamp decision="adopted" />
      </div>
    </main>
  );
}
