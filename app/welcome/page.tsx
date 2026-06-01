import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { setupProfileAction } from "./actions";
import { getDisplayName } from "@/lib/profile";

/**
 * 新規サインアップ後のメール確認直後に表示される「ようこそ」画面。
 * 認証されているがまだ表示名を設定していないユーザー向け。
 *
 * /auth/callback から display_name 未設定のユーザーをここへ誘導する。
 */
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/welcome${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ""}`)}`
    );
  }

  // 既に表示名がある場合はここに来る必要なし
  const meta = (user.user_metadata as Record<string, unknown>) ?? {};
  const hasName =
    typeof meta.display_name === "string" && meta.display_name.trim();
  if (hasName) {
    redirect(safeNext ?? "/");
  }

  const placeholder = getDisplayName(user);

  return (
    <main className="flex-1 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-clay text-white grid place-items-center text-2xl font-bold shadow-lg">
            家
          </div>
          <h1 className="font-mincho text-2xl mb-2">ようこそ！</h1>
          <p className="text-xs text-ink-soft leading-relaxed">
            登録ありがとうございます 🌱
            <br />
            最初に <b>アプリ内で表示される名前</b> を決めさせてください。
            <br />
            <span className="text-ink-faint">
              （メールアドレスは家族以外には見えません）
            </span>
          </p>
        </div>

        <div className="bg-surface border border-line rounded-[var(--radius-card)] shadow-[0_5px_14px_rgba(60,45,30,0.05)] p-6">
          {error && (
            <p className="mb-4 text-xs bg-clay-soft text-[#8a3d20] border border-[#ecc7b3] rounded-lg px-3 py-2.5">
              {error}
            </p>
          )}

          <form action={setupProfileAction} className="space-y-4">
            {safeNext && (
              <input type="hidden" name="next" value={safeNext} />
            )}
            <div>
              <Label htmlFor="welcome-name">表示名</Label>
              <Input
                id="welcome-name"
                name="name"
                type="text"
                placeholder={`例: 鈴木さん / お父さん / ${placeholder}`}
                maxLength={40}
                autoFocus
                required
              />
              <p className="text-[11px] text-ink-faint mt-1.5 leading-relaxed">
                家族から呼ばれる名前にすると親しみやすいです。
                <br />
                後でマイページから変更できます。
              </p>
            </div>
            <Button type="submit" size="lg" className="w-full">
              この名前で始める
            </Button>
          </form>

          <form action={setupProfileAction}>
            {safeNext && (
              <input type="hidden" name="next" value={safeNext} />
            )}
            <input type="hidden" name="name" value="" />
            <button
              type="submit"
              className="w-full mt-3 text-[12px] text-ink-faint hover:text-ink-soft tap-44 py-2"
            >
              後で設定する
            </button>
          </form>
        </div>

        {safeNext?.startsWith("/join/") && (
          <p className="mt-4 text-[11px] text-center text-clay">
            設定後、招待されたルームに参加します ✉
          </p>
        )}
      </div>
    </main>
  );
}
