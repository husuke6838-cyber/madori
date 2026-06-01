import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export default async function MyPage() {
  const { supabase, user } = await requireUser();

  /**
   * 自分が所属するプロジェクト一覧。
   *   - 自分が owner のもの
   *   - project_members に自分の user_id があるもの
   * いずれも RLS で SELECT 可。
   */
  const { data: ownedProjects } = await supabase
    .from("projects")
    .select("id, name, updated_at")
    .order("updated_at", { ascending: false });

  const projects = ownedProjects ?? [];

  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-6">
      <div className="mb-5">
        <p className="text-xs text-ink-soft">こんにちは</p>
        <p className="text-sm font-bold mt-0.5">{user.email}</p>
      </div>

      <h2 className="font-mincho text-lg mb-3">あなたのルーム</h2>

      {projects.length === 0 ? (
        <div className="border border-dashed border-line bg-surface-2 rounded-[var(--radius-card)] px-5 py-8 text-center text-sm text-ink-soft">
          まだルームがありません
          <br />
          下のボタンから最初のルームを作りましょう
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/r/${p.id}/note`}
                className="block bg-surface border border-line rounded-[var(--radius-card)] px-4 py-4 shadow-[0_5px_14px_rgba(60,45,30,0.05)] active:bg-surface-2"
              >
                <div className="font-mincho text-base">{p.name}</div>
                <div className="text-[11px] text-ink-faint mt-0.5">
                  最終更新 {new Date(p.updated_at).toLocaleDateString("ja-JP")}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <Link href="/rooms/new">
          <Button size="lg" className="w-full">
            ＋ 新しいルームを作る
          </Button>
        </Link>
      </div>
    </main>
  );
}
