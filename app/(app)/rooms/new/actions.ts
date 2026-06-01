"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_MEMBERS, ROOM_TEMPLATES } from "@/lib/seeds";

/**
 * 新規ルーム（projects）作成。
 *
 * 設計メモ:
 * - 認証は requireUser() で「自分が誰か」を Cookie ベースで確定させる
 * - DB 書き込みは admin クライアント（service_role）で行う
 *   - owner_id にサーバ側で検証済みの user.id を埋め込むため、なりすまし不可
 *   - Server Action から RLS 経由で書き込むと、ある条件下で JWT が
 *     PostgREST に届かず RLS が anon 扱いになり弾かれるケースがあるため、
 *     初期化系の owner-only 書き込みは admin で行うのが堅実
 * - 通常の閲覧・要望追加・★評価は user-scoped client + RLS で行う（別アクション）
 */
export async function createProjectAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/rooms/new?error=ルーム名を入力してください");
  }

  const { user } = await requireUser();
  const admin = createSupabaseAdminClient();

  // 1. projects
  const { data: project, error: projectErr } = await admin
    .from("projects")
    .insert({ owner_id: user.id, name })
    .select("id")
    .single();
  if (projectErr || !project) {
    redirect(
      `/rooms/new?error=${encodeURIComponent(
        projectErr?.message ?? "ルーム作成に失敗しました"
      )}`
    );
  }

  // 2. 家族メンバー（奥さん / 旦那さん）
  //    奥さん側に作成者の user_id を紐付ける（後で UI から付け替え可）
  const members = DEFAULT_MEMBERS.map((m, idx) => ({
    project_id: project.id,
    user_id: idx === 0 ? user.id : null,
    name: m.name,
    color: m.color,
    role: idx === 0 ? "owner" : "editor",
    sort_order: idx,
  }));
  const { error: membersErr } = await admin
    .from("project_members")
    .insert(members);
  if (membersErr) {
    redirect(
      `/rooms/new?error=${encodeURIComponent(
        "家族メンバーの作成に失敗: " + membersErr.message
      )}`
    );
  }

  // 3. 部屋テンプレ
  const rooms = ROOM_TEMPLATES.map((t, idx) => ({
    project_id: project.id,
    name: t.name,
    subtitle: t.subtitle ?? null,
    kind: t.kind,
    desired_jou: t.desired_jou ?? null,
    sort_order: idx,
  }));
  const { error: roomsErr } = await admin.from("rooms").insert(rooms);
  if (roomsErr) {
    redirect(
      `/rooms/new?error=${encodeURIComponent(
        "部屋テンプレの作成に失敗: " + roomsErr.message
      )}`
    );
  }

  revalidatePath("/", "layout");
  redirect(`/r/${project.id}/note`);
}
