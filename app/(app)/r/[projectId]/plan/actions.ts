"use server";

import { revalidatePath } from "next/cache";
import { requireProjectMember } from "@/lib/auth";

/**
 * 共有リンク（/share/[token]）を発行 or 既存トークンを取得して返す。
 * 既存があれば再利用、無ければ新規作成。
 */
export async function ensureShareLinkAction(projectId: string): Promise<string> {
  const { user, admin } = await requireProjectMember(projectId);

  const { data: existing } = await admin
    .from("share_links")
    .select("token")
    .eq("project_id", projectId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.token) return existing.token;

  // 32 byte 乱数を base64url で
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  const token = Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const { error } = await admin.from("share_links").insert({
    project_id: projectId,
    token,
    created_by: user.id,
  });
  if (error) throw new Error("共有リンクの作成に失敗: " + error.message);

  revalidatePath(`/r/${projectId}/plan`);
  return token;
}

/**
 * 共有リンクを失効させる（revoked_at を立てる）。
 */
export async function revokeShareLinkAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return;
  const { admin } = await requireProjectMember(projectId);

  await admin
    .from("share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .is("revoked_at", null);

  revalidatePath(`/r/${projectId}/plan`);
}
