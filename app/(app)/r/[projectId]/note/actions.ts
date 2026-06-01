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
  const { user, admin, projectId } = await requireUser_via_room(roomId);

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

  revalidatePathByRoom(roomId, projectId);
}

/**
 * 要望を削除。
 */
export async function deleteItemAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;

  const { admin, roomId, projectId } = await requireUser_via_item(itemId);
  await admin.from("items").delete().eq("id", itemId);
  revalidatePathByRoom(roomId, projectId);
}

/**
 * 要望の本文を更新（取り消し線で旧テキストを残す）。
 */
export async function updateItemTextAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!itemId || !text) return;

  const { user, admin, roomId, projectId } = await requireUser_via_item(itemId);

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

  revalidatePathByRoom(roomId, projectId);
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

  const { admin, roomId, projectId } = await requireUser_via_item(itemId);

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

  revalidatePathByRoom(roomId, projectId);
}

/**
 * 要望の型番・仕様メモを更新（床材・壁紙などの確定情報、仕様§5.2）。
 */
export async function updateItemSpecAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const spec = String(formData.get("spec_model") ?? "").trim();
  if (!itemId) return;

  const { admin, roomId, projectId } = await requireUser_via_item(itemId);

  await admin
    .from("items")
    .update({
      spec_model: spec || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  revalidatePathByRoom(roomId, projectId);
}

/**
 * 要望のメモを更新（履歴は残さない）。
 */
export async function updateItemMemoAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const memo = String(formData.get("memo") ?? "").trim();
  if (!itemId) return;

  const { admin, roomId, projectId } = await requireUser_via_item(itemId);

  await admin
    .from("items")
    .update({ memo: memo || null, updated_at: new Date().toISOString() })
    .eq("id", itemId);

  revalidatePathByRoom(roomId, projectId);
}

/**
 * 要望に画像をアップロード。
 * - 1ファイル 5MB 上限、image/* のみ
 * - 命名規約: `{projectId}/{itemId}/{timestamp}-{filename}`
 *   migration の Storage RLS と整合
 */
export async function addItemImageAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const file = formData.get("file");
  if (!itemId || !(file instanceof File) || file.size === 0) return;
  if (file.size > 5 * 1024 * 1024)
    throw new Error("画像は5MB以下にしてください");
  if (!file.type.startsWith("image/"))
    throw new Error("画像ファイルのみアップロードできます");

  const { admin, roomId, projectId } = await requireUser_via_item(itemId);

  const safe = file.name.replace(/[^\w.\-]/g, "_").slice(-60);
  const path = `${projectId}/${itemId}/${Date.now()}-${safe}`;

  const upload = await admin.storage
    .from("item-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) {
    throw new Error("アップロード失敗: " + upload.error.message);
  }

  // 末尾追加
  const { data: maxRow } = await admin
    .from("item_images")
    .select("sort_order")
    .eq("item_id", itemId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  await admin.from("item_images").insert({
    item_id: itemId,
    storage_path: path,
    sort_order: nextOrder,
  });

  revalidatePathByRoom(roomId, projectId);
}

/**
 * 要望から画像を削除（Storage と DB の両方）。
 */
export async function deleteItemImageAction(formData: FormData) {
  const imageId = String(formData.get("imageId") ?? "");
  if (!imageId) return;

  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const admin = createSupabaseAdminClient();

  const { data: image } = await admin
    .from("item_images")
    .select("storage_path, item_id, items!inner(room_id, rooms!inner(project_id))")
    .eq("id", imageId)
    .maybeSingle();
  if (!image) return;
  // @ts-expect-error PostgREST inner join shape
  const projectId = image.items.rooms.project_id;
  // @ts-expect-error PostgREST inner join shape
  const roomId = image.items.room_id;
  await requireProjectMember(projectId);

  await admin.storage.from("item-images").remove([image.storage_path]);
  await admin.from("item_images").delete().eq("id", imageId);

  revalidatePathByRoom(roomId, projectId);
}

/**
 * 要望に参考リンクを追加。OGP は /api/og で事前取得して渡してもらう。
 */
export async function addItemLinkAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  if (!itemId || !url) return;
  try {
    new URL(url);
  } catch {
    throw new Error("URL の形式が正しくありません");
  }
  const ogTitle = (String(formData.get("og_title") ?? "").trim() || null) as
    | string
    | null;
  const ogImage = (String(formData.get("og_image") ?? "").trim() || null) as
    | string
    | null;
  const ogDesc = (String(formData.get("og_desc") ?? "").trim() || null) as
    | string
    | null;

  const { admin, roomId, projectId } = await requireUser_via_item(itemId);

  const { data: maxRow } = await admin
    .from("item_links")
    .select("sort_order")
    .eq("item_id", itemId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  await admin.from("item_links").insert({
    item_id: itemId,
    url,
    og_title: ogTitle,
    og_image: ogImage,
    og_desc: ogDesc,
    sort_order: nextOrder,
  });

  revalidatePathByRoom(roomId, projectId);
}

/**
 * 要望から参考リンクを削除。
 */
export async function deleteItemLinkAction(formData: FormData) {
  const linkId = String(formData.get("linkId") ?? "");
  if (!linkId) return;

  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const admin = createSupabaseAdminClient();

  const { data: link } = await admin
    .from("item_links")
    .select("item_id, items!inner(room_id, rooms!inner(project_id))")
    .eq("id", linkId)
    .maybeSingle();
  if (!link) return;
  // @ts-expect-error PostgREST inner join shape
  const projectId = link.items.rooms.project_id;
  // @ts-expect-error PostgREST inner join shape
  const roomId = link.items.room_id;
  await requireProjectMember(projectId);

  await admin.from("item_links").delete().eq("id", linkId);
  revalidatePathByRoom(roomId, projectId);
}

/**
 * 「この場所は特に要望なし（確認済み）」のトグル。
 */
export async function toggleNoRequestAction(formData: FormData) {
  const roomId = String(formData.get("roomId") ?? "");
  if (!roomId) return;

  const { admin, projectId } = await requireUser_via_room(roomId);

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

  revalidatePathByRoom(roomId, projectId);
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

/**
 * note タブと plan タブ（要望リストを参照する）のみ再検証する。
 * /r 全体 layout を invalidate すると invite token や project 情報まで
 * 再フェッチして重いので避ける。
 */
function revalidatePathByRoom(_roomId: string, projectId?: string) {
  if (projectId) {
    revalidatePath(`/r/${projectId}/note`);
    revalidatePath(`/r/${projectId}/plan`);
  }
}
