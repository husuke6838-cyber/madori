"use server";

import { revalidatePath } from "next/cache";
import { requireProjectMember } from "@/lib/auth";

/**
 * 要望を追加。
 * 部屋IDからプロジェクトIDを引いてメンバーシップを確認する。
 */
export async function addItemAction(formData: FormData) {
  const roomId = String(formData.get("roomId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!roomId || !text) return;

  // 部屋からプロジェクトIDを引く（service_role なので RLS は通らない）
  const { user, admin } = await requireUser_via_room(roomId);

  // 現在の最大 sort_order を取得して末尾追加
  const { data: maxRow } = await admin
    .from("items")
    .select("sort_order")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  await admin.from("items").insert({
    room_id: roomId,
    text,
    sort_order: nextOrder,
    created_by: user.id,
  });

  // 要望が追加されたら no_request はクリアする
  await admin
    .from("rooms")
    .update({ no_request: false })
    .eq("id", roomId);

  revalidatePathByRoom(roomId);
}

/**
 * 要望を削除。
 */
export async function deleteItemAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;

  const { admin, roomId } = await requireUser_via_item(itemId);
  await admin.from("items").delete().eq("id", itemId);
  revalidatePathByRoom(roomId);
}

/**
 * 要望の本文を更新（取り消し線で旧テキストを残す）。
 */
export async function updateItemTextAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!itemId || !text) return;

  const { user, admin, roomId } = await requireUser_via_item(itemId);

  const { data: current } = await admin
    .from("items")
    .select("text")
    .eq("id", itemId)
    .maybeSingle();
  if (!current) return;

  if (current.text !== text) {
    // 変更履歴に旧テキストを残す
    await admin.from("item_revisions").insert({
      item_id: itemId,
      prev_text: current.text,
      changed_by: user.id,
    });
    await admin
      .from("items")
      .update({ text, updated_at: new Date().toISOString() })
      .eq("id", itemId);
  }

  revalidatePathByRoom(roomId);
}

/**
 * ★評価を設定（同じ値を2回押したら -1 にする：減点トグル）。
 * 0 にしたい場合は明示的に 0 を渡す。
 */
export async function setRatingAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const stars = Number(formData.get("stars") ?? 0);
  if (!itemId || !memberId) return;
  if (stars < 0 || stars > 3 || !Number.isInteger(stars)) return;

  const { admin, roomId } = await requireUser_via_item(itemId);

  if (stars === 0) {
    await admin
      .from("ratings")
      .delete()
      .eq("item_id", itemId)
      .eq("member_id", memberId);
  } else {
    await admin
      .from("ratings")
      .upsert(
        { item_id: itemId, member_id: memberId, stars },
        { onConflict: "item_id,member_id" }
      );
  }

  revalidatePathByRoom(roomId);
}

/**
 * 「この場所は特に要望なし（確認済み）」のトグル。
 */
export async function toggleNoRequestAction(formData: FormData) {
  const roomId = String(formData.get("roomId") ?? "");
  if (!roomId) return;

  const { admin } = await requireUser_via_room(roomId);

  const { data: room } = await admin
    .from("rooms")
    .select("no_request")
    .eq("id", roomId)
    .maybeSingle();
  if (!room) return;

  await admin
    .from("rooms")
    .update({ no_request: !room.no_request })
    .eq("id", roomId);

  revalidatePathByRoom(roomId);
}

// =========================================================
// ヘルパ
// =========================================================

async function requireUser_via_room(roomId: string) {
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const admin = createSupabaseAdminClient();
  const { data: room } = await admin
    .from("rooms")
    .select("project_id")
    .eq("id", roomId)
    .maybeSingle();
  if (!room) throw new Error("部屋が見つかりません");
  const m = await requireProjectMember(room.project_id);
  return { ...m, roomId, projectId: room.project_id };
}

async function requireUser_via_item(itemId: string) {
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const admin = createSupabaseAdminClient();
  const { data: item } = await admin
    .from("items")
    .select("room_id, rooms!inner(project_id)")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) throw new Error("要望が見つかりません");
  const roomId = item.room_id;
  // @ts-expect-error PostgREST inner join shape
  const projectId = item.rooms.project_id;
  const m = await requireProjectMember(projectId);
  return { ...m, roomId, projectId };
}

function revalidatePathByRoom(_roomId: string) {
  // ルームに紐づくノートページを更新（projectIdの取得を省くため layout 全体を再検証）
  revalidatePath("/r", "layout");
}
