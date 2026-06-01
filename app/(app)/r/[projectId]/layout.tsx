import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BottomNav } from "./BottomNav";
import { InviteButton } from "./InviteButton";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requireUser();

  // 管理者クライアントでメンバーシップを確認（admin パターンと整合）
  const admin = createSupabaseAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  const { data: invite } = await admin
    .from("project_invites")
    .select("token")
    .eq("project_id", projectId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <div className="flex-1 max-w-md mx-auto w-full pb-20">
        <div className="flex items-center justify-end px-4 pt-2 print:hidden">
          <InviteButton
            projectId={projectId}
            initialToken={invite?.token ?? null}
          />
        </div>
        {children}
      </div>
      <BottomNav projectId={projectId} />
    </>
  );
}
