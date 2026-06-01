import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; next?: string }>;
}) {
  const { error, notice, next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const signupHref = safeNext
    ? `/signup?next=${encodeURIComponent(safeNext)}`
    : "/signup";

  return (
    <div className="bg-surface border border-line rounded-[var(--radius-card)] shadow-[0_5px_14px_rgba(60,45,30,0.05)] p-6">
      <h2 className="text-xl font-bold mb-5">ログイン</h2>

      {notice && (
        <p className="mb-4 text-xs bg-sage-soft text-[#46532f] border border-[#d6ddc7] rounded-lg px-3 py-2.5 leading-relaxed">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-4 text-xs bg-clay-soft text-[#8a3d20] border border-[#ecc7b3] rounded-lg px-3 py-2.5 leading-relaxed">
          {error}
        </p>
      )}

      {safeNext?.startsWith("/join/") && (
        <p className="mb-4 text-xs bg-clay-soft text-[#8a3d20] border border-[#ecc7b3] rounded-lg px-3 py-2.5 leading-relaxed">
          ✉ 招待リンクで開きました。ログインすると参加できます。
        </p>
      )}

      <form action={loginAction} className="space-y-4">
        {safeNext && <input type="hidden" name="next" value={safeNext} />}
        <div>
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" size="lg" className="w-full">
          ログイン
        </Button>
      </form>

      <p className="mt-5 text-xs text-center text-ink-soft">
        アカウントをお持ちでない方は{" "}
        <Link href={signupHref} className="text-clay font-bold">
          新規登録
        </Link>
      </p>
    </div>
  );
}
