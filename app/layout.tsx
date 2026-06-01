import type { Metadata, Viewport } from "next";
import { Shippori_Mincho, Zen_Kaku_Gothic_New, Outfit } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { THEMES, isValidTheme, type ThemeId } from "@/lib/theme";

const mincho = Shippori_Mincho({
  variable: "--font-mincho",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const zen = Zen_Kaku_Gothic_New({
  variable: "--font-zen",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "私のおうちカルテ",
  description:
    "家族でワクワク書きためる、家づくり計画ノート。要望・参考写真・★評価から計画書と間取りまで一気通貫。",
  applicationName: "私のおうちカルテ",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "おうちカルテ",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo-app-icon.svg",
    apple: "/icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#e2603f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Cookie からテーマを取り、サーバ側で <html data-theme> を設定
  // → ちらつき無し
  const cookieStore = await cookies();
  const raw = cookieStore.get("__theme")?.value;
  const theme: ThemeId = isValidTheme(raw) ? raw : "blue";
  void THEMES; // tree-shake guard

  return (
    <html
      lang="ja"
      data-theme={theme}
      className={`${mincho.variable} ${zen.variable} ${outfit.variable}`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink">
        {children}
      </body>
    </html>
  );
}
