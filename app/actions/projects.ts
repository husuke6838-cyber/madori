"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * プロジェクト（ルーム）削除。
 * - オーナーのみ実行可：owner_id が認証ユーザと一致する場合のみ削除する
 * - 配下の rooms / items / ratings / floorplans / share_links / meeting_logs / project_members
 *   は ON DELETE CASCADE で自動的に削除される
 */
export async function deleteProjectAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) {
    redirect("/?error=削除対象が指定されていません");
  }

  const { user } = await requireUser();
  const admin = createSupabaseAdminClient();

  // 所有者チェック付きで削除（owner_id = user.id のもののみ）
  const { error, count } = await admin
    .from("projects")
    .delete({ count: "exact" })
    .eq("id", projectId)
    .eq("owner_id", user.id);

  if (error) {
    redirect(`/?error=${encodeURIComponent("削除に失敗: " + error.message)}`);
  }
  if (!count) {
    redirect("/?error=削除権限がないか、ルームが見つかりません");
  }

  revalidatePath("/", "layout");
  redirect("/");
}
