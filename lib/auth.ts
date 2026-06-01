import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "./supabase/server";
import { createSupabaseAdminClient } from "./supabase/admin";

/**
 * 同一リクエスト内で getUser() を 1 回にまとめる。
 * layout と page の両方で requireUser を呼んでも、Supabase Auth への
 * ネットワーク呼び出しは 1 回だけになる。
 */
const _getAuth = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
});

/**
 * 認証必須ページの先頭で呼ぶ。
 * 未ログインなら /login へリダイレクトする。
 */
export async function requireUser() {
  const { supabase, user } = await _getAuth();
  if (!user) redirect("/login");
  return { supabase, user };
}

/**
 * 同一リクエスト内でプロジェクト基本情報を1回だけ引く。
 * layout / page どちらから呼んでも DB 往復は1回。
 */
export const getProjectBasic = cache(async (projectId: string) => {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("projects")
    .select("id, name, owner_id")
    .eq("id", projectId)
    .maybeSingle();
  return data;
});

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
