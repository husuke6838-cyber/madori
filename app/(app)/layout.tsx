import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOutAction } from "@/app/actions/auth";
import { getDisplayName } from "@/lib/profile";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();
  const displayName = getDisplayName(user);

  return (
    <>
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-line">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-clay text-white grid place-items-center text-sm font-bold shadow">
              家
            </span>
            <span className="font-mincho font-bold text-base">
              いえづくりノート
            </span>
          </Link>
          <Link
            href="/me"
            className="ml-auto flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink px-2 py-1.5 tap-44"
            title="プロフィール"
          >
            <span className="w-6 h-6 rounded-full bg-clay-soft text-clay grid place-items-center text-[11px] font-bold">
              {displayName.charAt(0)}
            </span>
            <span className="truncate max-w-[7em]">{displayName}</span>
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-[11px] text-ink-faint hover:text-ink px-2 py-1.5 tap-44"
            >
              ログアウト
            </button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
