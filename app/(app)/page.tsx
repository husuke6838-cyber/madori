import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { DeleteProjectButton } from "./ProjectCardActions";
import { getDisplayName } from "@/lib/profile";

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase, user } = await requireUser();

  const { data: ownedProjects } = await supabase
    .from("projects")
    .select("id, name, updated_at")
    .order("updated_at", { ascending: false });

  const projects = ownedProjects ?? [];

  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-6">
      <div className="mb-5">
        <p className="text-xs text-ink-soft">こんにちは</p>
        <p className="text-base font-bold mt-0.5">
          {getDisplayName(user)} <span className="text-xs text-ink-faint font-normal">さん</span>
        </p>
        <Link
          href="/me"
          className="text-[11px] text-clay underline underline-offset-2 mt-1 inline-block tap-44 py-0.5"
        >
          表示名を変える
        </Link>
      </div>

      {error && (
        <p className="mb-4 text-xs bg-clay-soft text-[#8a3d20] border border-[#ecc7b3] rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

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
            <li
              key={p.id}
              className="bg-surface border border-line rounded-[var(--radius-card)] shadow-[0_5px_14px_rgba(60,45,30,0.05)] flex items-stretch"
            >
              <Link
                href={`/r/${p.id}/note`}
                className="flex-1 min-w-0 px-4 py-4 active:bg-surface-2 rounded-l-[var(--radius-card)]"
              >
                <div className="font-mincho text-base truncate">{p.name}</div>
                <div className="text-[11px] text-ink-faint mt-0.5">
                  最終更新 {new Date(p.updated_at).toLocaleDateString("ja-JP")}
                </div>
              </Link>
              <div className="border-l border-line flex items-center">
                <DeleteProjectButton projectId={p.id} projectName={p.name} />
              </div>
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
