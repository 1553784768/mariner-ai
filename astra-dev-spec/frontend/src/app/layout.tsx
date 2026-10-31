import type { Metadata } from "next";
import { Archivo, Hanken_Grotesk, Space_Mono, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import "./workspace.css";
import { Providers } from "@/components/providers";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-archivo",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
});
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono" });
const noto = Noto_Sans_SC({
  weight: ["400", "500", "700", "900"],
  preload: false,
  variable: "--font-noto-sc",
});
export const metadata: Metadata = { title: "Mariner AI", icons: { icon: "/favicon.png" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${archivo.variable} ${hanken.variable} ${mono.variable} ${noto.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
