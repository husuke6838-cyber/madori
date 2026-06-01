import { redirect } from "next/navigation";

export default async function RoomRoot({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/r/${projectId}/note`);
}
