"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { DEFAULT_MEMBERS, ROOM_TEMPLATES } from "@/lib/seeds";

export async function createProjectAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/rooms/new?error=ルーム名を入力してください");
  }

  const { supabase, user } = await requireUser();

  // 1. projects 作成
  const { data: project, error: projectErr } = await supabase
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

  // 2. デフォルト家族メンバー（奥さん / 旦那さん）
  //    owner は自分の user_id を「奥さん」に紐付ける（後でUIから変更可）
  const members = DEFAULT_MEMBERS.map((m, idx) => ({
    project_id: project.id,
    user_id: idx === 0 ? user.id : null,
    name: m.name,
    color: m.color,
    role: idx === 0 ? "owner" : "editor",
    sort_order: idx,
  }));
  const { error: membersErr } = await supabase
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
  const { error: roomsErr } = await supabase.from("rooms").insert(rooms);
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
