import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { LogTimeline } from "./LogTimeline";
import { AddLogFAB } from "./AddLogFAB";

export default async function LogTab({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requireUser();

  const admin = createSupabaseAdminClient();
  const { data: logs } = await admin
    .from("meeting_logs")
    .select("id, log_date, title, said_us, said_them, status")
    .eq("project_id", projectId)
    .order("log_date", { ascending: false });

  const list = (logs ?? []).map((l) => ({
    id: l.id as string,
    logDate: l.log_date as string,
    title: l.title as string,
    saidUs: (l.said_us as string | null) ?? "",
    saidThem: (l.said_them as string | null) ?? "",
    status: (l.status as "done" | "planned") ?? "done",
  }));

  return (
    <>
      <main className="px-5 py-5">
        <div className="text-2xl font-bold mb-1">打ち合わせの記録</div>
        <p className="text-xs text-ink-soft mb-6 leading-relaxed">
          いつ・何を話したか・担当の方の回答をタイムラインで残す。
          <br />
          「言った言わない」を防ぐ家族の備忘録です。
        </p>

        {list.length === 0 ? (
          <div className="text-center py-8 px-4 text-[13px] text-ink-faint border border-dashed border-line rounded-[14px] bg-surface-2">
            まだ記録がありません。
            <br />
            右下の ＋ ボタンから打ち合わせを追加できます ✎
          </div>
        ) : (
          <LogTimeline projectId={projectId} logs={list} />
        )}
      </main>
      <AddLogFAB projectId={projectId} />
    </>
  );
}
