import { requireUser } from "@/lib/auth";
import { loadPlanData } from "@/lib/plan";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PlanDocument } from "@/components/PlanDocument";
import { PlanToolbar } from "./PlanToolbar";
import { AffiliateNudge } from "@/components/AffiliateNudge";

export default async function PlanTab({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requireUser();

  const data = await loadPlanData(projectId);
  if (!data) {
    return (
      <main className="px-5 py-10 text-center text-ink-soft">
        計画書を準備中です…
      </main>
    );
  }

  // 既存の有効な共有リンク（あれば）を取得
  const admin = createSupabaseAdminClient();
  const { data: link } = await admin
    .from("share_links")
    .select("token")
    .eq("project_id", projectId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareUrl = link?.token ? `${baseUrl}/share/${link.token}` : null;

  return (
    <>
      <PlanToolbar
        projectId={projectId}
        projectName={data.projectName}
        initialShareUrl={shareUrl}
      />
      <PlanDocument
        projectName={data.projectName}
        members={data.members}
        rooms={data.rooms}
        floorplans={data.floorplans}
        generatedAt={new Date()}
      />
      <div className="px-5 pb-8 print:hidden">
        <AffiliateNudge />
      </div>
    </>
  );
}
