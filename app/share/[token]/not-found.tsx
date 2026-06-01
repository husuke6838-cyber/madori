import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-clay-soft text-clay grid place-items-center text-2xl">
          🔗
        </div>
        <h1 className="text-xl font-bold mb-2">
          共有リンクが見つかりませんでした
        </h1>
        <p className="text-sm text-ink-soft leading-relaxed mb-6">
          リンクが間違っているか、所有者によって失効された可能性があります。
          <br />
          リンクの発行者に確認してください。
        </p>
        <Link
          href="/"
          className="inline-block text-clay font-bold text-sm tap-44 px-4 py-3"
        >
          おうちカルテ トップへ →
        </Link>
      </div>
    </main>
  );
}
