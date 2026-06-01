import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { BottomNav } from "./BottomNav";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireUser();

  // 自分がアクセス権を持つプロジェクトか確認（RLS により他人のは取れない）
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  return (
    <>
      <div className="flex-1 max-w-md mx-auto w-full pb-20">{children}</div>
      <BottomNav projectId={projectId} />
    </>
  );
}
