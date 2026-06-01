import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { createSupabaseAdminClient } from "./supabase/admin";

/**
 * 認証必須ページの先頭で呼ぶ。
 * 未ログインなら /login へリダイレクトする。
 */
export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/**
 * 指定プロジェクトのメンバーであることを保証する。
 * - owner（projects.owner_id）または project_members に user_id が紐づく
 * - DB 確認は admin（service_role）で行い、Server Action からの
 *   user-scoped JWT 経路差異の影響を受けないようにする
 *
 * 戻り値の admin は同じ Server Action 内で書き込みに再利用してよい。
 */
export async function requireProjectMember(projectId: string) {
  const { user } = await requireUser();
  const admin = createSupabaseAdminClient();

  const [{ data: project }, { data: member }] = await Promise.all([
    admin
      .from("projects")
      .select("id, owner_id")
      .eq("id", projectId)
      .maybeSingle(),
    admin
      .from("project_members")
      .select("id, user_id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!project) {
    redirect("/?error=ルームが見つかりません");
  }

  const isOwner = project.owner_id === user.id;
  if (!isOwner && !member) {
    redirect("/?error=このルームへのアクセス権がありません");
  }

  return { user, admin, projectId, isOwner };
}
