import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { signUpAction } from "./actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="bg-surface border border-line rounded-[var(--radius-card)] shadow-[0_5px_14px_rgba(60,45,30,0.05)] p-6">
      <h2 className="font-mincho text-xl mb-5">新規登録</h2>

      {error && (
        <p className="mb-4 text-xs bg-clay-soft text-[#8a3d20] border border-[#ecc7b3] rounded-lg px-3 py-2.5 leading-relaxed">
          {error}
        </p>
      )}

      <form action={signUpAction} className="space-y-4">
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
          <Label htmlFor="password">パスワード（8文字以上）</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <Button type="submit" size="lg" className="w-full">
          アカウントを作成
        </Button>
      </form>

      <p className="mt-5 text-xs text-center text-ink-soft">
        既にアカウントをお持ちの方は{" "}
        <Link href="/login" className="text-clay font-bold">
          ログイン
        </Link>
      </p>
    </div>
  );
}
