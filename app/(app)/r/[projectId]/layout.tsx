import { notFound } from "next/navigation";
import { requireUser, getProjectBasic } from "@/lib/auth";
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

  // cache() で page と dedup される
  const project = await getProjectBasic(projectId);
  if (!project) notFound();

  return (
    <>
      <div className="flex-1 max-w-md mx-auto w-full pb-20">
        <div className="flex items-center justify-end px-4 pt-2 print:hidden">
          <InviteButton projectId={projectId} />
        </div>
        {children}
      </div>
      <BottomNav projectId={projectId} />
    </>
  );
}
