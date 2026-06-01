import Link from "next/link";

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
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-line print:hidden">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-clay text-white grid place-items-center text-sm font-bold shadow">
              家
            </span>
            <span className="font-mincho font-bold text-base">
              いえづくりノート
            </span>
          </Link>
          <Link
            href="/signup"
            className="ml-auto text-xs text-clay font-bold px-2 py-1.5 tap-44"
          >
            自分も使ってみる
          </Link>
        </div>
      </header>
      {children}
    </>
  );
}
