import Link from "next/link";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { signOutAction } from "@/app/actions/auth";
import { getDisplayName } from "@/lib/profile";
import { isValidTheme, THEME_COOKIE, type ThemeId } from "@/lib/theme";
import { LogoLockup } from "@/components/Logo";
import { ThemePicker } from "@/components/ThemePicker";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();
  const displayName = getDisplayName(user);

  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get(THEME_COOKIE)?.value;
  const theme: ThemeId = isValidTheme(cookieTheme) ? cookieTheme : "blue";

  return (
    <>
      <header className="sticky top-0 z-30 bg-surf border-b border-line">
        <div className="max-w-md mx-auto px-4 py-2.5 flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <LogoLockup size="sm" />
          </Link>
          <ThemePicker currentTheme={theme} />
          <Link
            href="/me"
            className="ml-auto flex items-center gap-1.5 text-xs text-soft hover:text-ink px-1.5 py-1.5 tap-44"
            title="プロフィール"
          >
            <span className="w-6 h-6 rounded-full bg-accent-soft text-accent grid place-items-center text-[11px] font-bold">
              {displayName.charAt(0)}
            </span>
            <span className="truncate max-w-[6em]">{displayName}</span>
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-[11px] text-faint hover:text-ink px-2 py-1.5 tap-44"
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
