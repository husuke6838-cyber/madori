import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadPlanData } from "@/lib/plan";
import { PlanDocument } from "@/components/PlanDocument";
import { AffiliateNudge } from "@/components/AffiliateNudge";

/**
 * 公開ビュー：ログイン不要で計画書を表示。
 * - share_links.token から project を引き、有効（revoked_at IS NULL）なら表示
 * - サーバ側 service_role でデータ取得（クライアントには service_role を出さない）
 */
export default async function SharedPlan({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();

  const { data: link } = await admin
    .from("share_links")
    .select("project_id, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (!link || link.revoked_at) {
    notFound();
  }

  const data = await loadPlanData(link.project_id);
  if (!data) notFound();

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full bg-paper">
      <div className="px-5 pt-5 pb-2 text-center print:hidden">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-ink-faint bg-surface-2 border border-line rounded-full px-3 py-1">
          🔗 共有リンクで閲覧中（編集はできません）
        </div>
      </div>
      <PlanDocument
        projectName={data.projectName}
        members={data.members}
        rooms={data.rooms}
        generatedAt={new Date()}
      />
      <div className="px-5 pb-10 print:hidden">
        <AffiliateNudge />
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
