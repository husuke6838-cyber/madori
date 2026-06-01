import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { updateDisplayNameAction } from "./actions";
import { getDisplayName } from "@/lib/profile";

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { user } = await requireUser();
  const { error, notice } = await searchParams;
  const currentName = getDisplayName(user);

  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-6">
      <div className="mb-5 flex items-center gap-2">
        <Link
          href="/"
          className="text-ink-soft text-sm hover:text-ink tap-44 px-2 py-2"
        >
          ← 戻る
        </Link>
      </div>

      <h2 className="font-mincho text-2xl mb-2">プロフィール</h2>
      <p className="text-xs text-ink-soft mb-6 leading-relaxed">
        アプリ内に表示されるあなたの名前を設定できます。
        <br />
        招待リンクで参加する時の家族メンバー名にも使われます。
      </p>

      {notice && (
        <p className="mb-4 text-xs bg-sage-soft text-[#46532f] border border-[#d6ddc7] rounded-lg px-3 py-2.5">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-4 text-xs bg-clay-soft text-[#8a3d20] border border-[#ecc7b3] rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

      <form action={updateDisplayNameAction} className="space-y-4">
        <div>
          <Label htmlFor="display-name">表示名</Label>
          <Input
            id="display-name"
            name="name"
            type="text"
            defaultValue={currentName}
            placeholder="例: 鈴木さん / お父さん / 太郎"
            maxLength={40}
            required
          />
          <p className="text-[11px] text-ink-faint mt-1.5">
            ※ メールアドレスは他の人には表示されません
          </p>
        </div>
        <Button type="submit" size="lg" className="w-full">
          保存
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-line text-[12px] text-ink-faint">
        <div>
          <span className="font-bold text-ink-soft">登録メール：</span>{" "}
          {user.email}
        </div>
      </div>
    </main>
  );
}
