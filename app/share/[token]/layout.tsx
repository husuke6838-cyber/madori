import Link from "next/link";
import { LogoLockup } from "@/components/Logo";

/**
 * 共有ビュー用のレイアウト。
 * 認証チェック無し、ボトムナビ無し、最小限のヘッダのみ。
 */
export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-30 bg-surf border-b border-line print:hidden">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <LogoLockup size="sm" />
          </Link>
          <Link
            href="/signup"
            className="ml-auto text-xs text-accent font-bold px-2 py-1.5 tap-44"
          >
            自分も使ってみる
          </Link>
        </div>
      </header>
      {children}
    </>
  );
}
