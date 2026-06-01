import { requireUser } from "@/lib/auth";

export default async function NoteTab({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireUser();

  const [{ data: project }, { data: members }, { data: rooms }] =
    await Promise.all([
      supabase.from("projects").select("id, name").eq("id", projectId).single(),
      supabase
        .from("project_members")
        .select("id, name, color, role")
        .eq("project_id", projectId)
        .order("sort_order"),
      supabase
        .from("rooms")
        .select("id, name, kind, desired_jou")
        .eq("project_id", projectId)
        .order("sort_order"),
    ]);

  return (
    <main className="px-5 py-5">
      <div className="font-mincho text-2xl mb-1">{project?.name}</div>
      <p className="text-xs text-ink-soft mb-6">ノート（要望をかきためる）</p>

      <section className="mb-6">
        <h3 className="text-[10.5px] font-bold tracking-wider text-ink-faint mb-2">
          家族
        </h3>
        <div className="flex flex-wrap gap-2">
          {members?.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full"
              style={{ background: `${m.color}22`, color: m.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: m.color }}
              />
              {m.name}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-[10.5px] font-bold tracking-wider text-ink-faint mb-2">
          部屋
        </h3>
        <ul className="space-y-2">
          {rooms?.map((r) => (
            <li
              key={r.id}
              className="bg-surface border border-line rounded-[var(--radius-card)] px-4 py-3 flex items-center justify-between"
            >
              <span className="font-mincho text-base">{r.name}</span>
              {r.desired_jou && (
                <span className="text-[11px] font-bold text-[#9c6a3a] bg-[#f6ead9] border border-[#ecd6bd] px-2.5 py-1 rounded-full">
                  希望 {r.desired_jou}帖
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="text-center text-xs text-ink-faint border border-dashed border-line bg-surface-2 rounded-[var(--radius-card)] px-5 py-6 leading-relaxed">
        要望の追加・★評価・参考リンクは
        <br />
        Phase 1 ④ で実装します
      </div>
    </main>
  );
}
