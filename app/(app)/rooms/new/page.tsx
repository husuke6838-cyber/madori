import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { createProjectAction } from "./actions";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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

      <h2 className="font-mincho text-2xl mb-2">新しいルームを作る</h2>
      <p className="text-xs text-ink-soft mb-6 leading-relaxed">
        ルーム＝1件の家づくり。家族と共有して使う「家づくりノート」です。
        <br />
        作成後、家族メンバーの追加や部屋カテゴリの編集ができます。
      </p>

      {error && (
        <p className="mb-4 text-xs bg-clay-soft text-[#8a3d20] border border-[#ecc7b3] rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

      <form action={createProjectAction} className="space-y-4">
        <div>
          <Label htmlFor="name">ルーム名</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="例: 我が家の家づくり"
            maxLength={80}
            required
            autoFocus
          />
          <p className="text-[11px] text-ink-faint mt-1.5 leading-relaxed">
            ※ 家族の名前を入れると親しみやすいです（例：「鈴木家の家づくり」）
          </p>
        </div>

        <div className="bg-surface-2 border border-line rounded-lg p-3.5 text-xs text-ink-soft leading-relaxed">
          <p className="font-bold text-ink mb-1.5">作成すると自動でセットされるもの</p>
          <ul className="space-y-1 ml-3 list-disc">
            <li>家族メンバー：奥さん（ピンク）／旦那さん（青）</li>
            <li>部屋カテゴリ：全体・玄関・LDK・主寝室・子供部屋・浴室・洗面所・トイレ・収納・外構（計10個）</li>
            <li>各部屋に検討ヒントと後悔ポイント</li>
          </ul>
        </div>

        <Button type="submit" size="lg" className="w-full">
          このルームを作成する
        </Button>
      </form>
    </main>
  );
}
