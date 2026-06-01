"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProjectMember } from "@/lib/auth";
import {
  EMPTY_FLOORPLAN,
  FLOORPLAN_MAX,
  type FloorplanData,
} from "@/lib/floorplan";

/**
 * 新しい間取りを1件作る（DBトリガで最大5件まで）。
 */
export async function createFloorplanAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim() || nextDefaultName();
  if (!projectId) return;

  const { admin } = await requireProjectMember(projectId);

  // 件数チェック（DBトリガもあるが UI 用に事前確認）
  const { count } = await admin
    .from("floorplans")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if ((count ?? 0) >= FLOORPLAN_MAX) {
    redirect(`/r/${projectId}/floorplan?error=最大${FLOORPLAN_MAX}個までです`);
  }

  const { data: maxRow } = await admin
    .from("floorplans")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data: created, error } = await admin
    .from("floorplans")
    .insert({
      project_id: projectId,
      name,
      data: EMPTY_FLOORPLAN,
      sort_order: nextOrder,
    })
    .select("id")
    .single();
  if (error || !created) {
    redirect(`/r/${projectId}/floorplan?error=${encodeURIComponent("作成失敗: " + (error?.message ?? ""))}`);
  }

  revalidatePath(`/r/${projectId}/floorplan`);
  redirect(`/r/${projectId}/floorplan?fp=${created.id}`);
}

/**
 * 既存の間取りを複製。
 */
export async function duplicateFloorplanAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const floorplanId = String(formData.get("floorplanId") ?? "");
  if (!projectId || !floorplanId) return;

  const { admin } = await requireProjectMember(projectId);

  const { count } = await admin
    .from("floorplans")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if ((count ?? 0) >= FLOORPLAN_MAX) {
    redirect(`/r/${projectId}/floorplan?error=最大${FLOORPLAN_MAX}個までです`);
  }

  const { data: src } = await admin
    .from("floorplans")
    .select("name, grid_unit_mm, data")
    .eq("id", floorplanId)
    .single();
  if (!src) return;

  const { data: maxRow } = await admin
    .from("floorplans")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data: created } = await admin
    .from("floorplans")
    .insert({
      project_id: projectId,
      name: `${src.name} のコピー`,
      grid_unit_mm: src.grid_unit_mm,
      data: src.data,
      sort_order: nextOrder,
    })
    .select("id")
    .single();

  revalidatePath(`/r/${projectId}/floorplan`);
  if (created) redirect(`/r/${projectId}/floorplan?fp=${created.id}`);
}

/**
 * 名前変更。
 */
export async function renameFloorplanAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const floorplanId = String(formData.get("floorplanId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!projectId || !floorplanId || !name) return;
  const { admin } = await requireProjectMember(projectId);
  await admin
    .from("floorplans")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", floorplanId);
  revalidatePath(`/r/${projectId}/floorplan`);
}

/**
 * 削除。
 */
export async function deleteFloorplanAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const floorplanId = String(formData.get("floorplanId") ?? "");
  if (!projectId || !floorplanId) return;
  const { admin } = await requireProjectMember(projectId);
  await admin.from("floorplans").delete().eq("id", floorplanId);
  revalidatePath(`/r/${projectId}/floorplan`);
  redirect(`/r/${projectId}/floorplan`);
}

/**
 * 編集中の間取りデータを保存（debounce はクライアント側で）。
 */
export async function saveFloorplanDataAction(
  projectId: string,
  floorplanId: string,
  data: FloorplanData
) {
  if (!projectId || !floorplanId || !data) return;
  const { admin } = await requireProjectMember(projectId);
  await admin
    .from("floorplans")
    .update({ data, updated_at: new Date().toISOString() })
    .eq("id", floorplanId);
}

function nextDefaultName() {
  // クライアント側で適切な名前を渡してくれることが多いのでフォールバックのみ
  return "新しい間取り";
}
