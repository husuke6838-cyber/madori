"use server";

import { revalidatePath } from "next/cache";
import { requireProjectMember } from "@/lib/auth";

/**
 * 招待リンク発行（既存の有効リンクがあれば再利用）。
 * 永続リンク（複数人が同じURLで参加可、§1.5確認結果）。
 */
export async function ensureInviteTokenAction(projectId: string): Promise<string> {
  const { user, admin } = await requireProjectMember(projectId);

  const { data: existing } = await admin
    .from("project_invites")
    .select("token")
    .eq("project_id", projectId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.token) return existing.token;

  const buf = new Uint8Array(24);
  crypto.getRandomValues(buf);
  const token = Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const { error } = await admin.from("project_invites").insert({
    project_id: projectId,
    token,
    role: "editor",
    created_by: user.id,
  });
  if (error) throw new Error("招待リンクの発行に失敗: " + error.message);

  revalidatePath(`/r/${projectId}`, "layout");
  return token;
}

export async function revokeInviteAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return;
  const { admin } = await requireProjectMember(projectId);
  await admin
    .from("project_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .is("revoked_at", null);
  revalidatePath(`/r/${projectId}`, "layout");
}
