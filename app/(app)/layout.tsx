import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOutAction } from "@/app/actions/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();

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
          <form action={signOutAction} className="ml-auto">
            <button
              type="submit"
              className="text-xs text-ink-soft hover:text-ink px-2 py-1.5 tap-44"
              title={user.email ?? ""}
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
