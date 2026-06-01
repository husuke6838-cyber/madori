"use server";

import { revalidatePath } from "next/cache";
import { requireProjectMember } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function addFamilyMemberAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  if (!projectId || !name || !color) return;

  const { admin } = await requireProjectMember(projectId);

  const { data: maxRow } = await admin
    .from("project_members")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await admin.from("project_members").insert({
    project_id: projectId,
    name,
    color,
    role: "editor",
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });

  revalidatePath(`/r/${projectId}`, "layout");
}

export async function updateFamilyMemberAction(formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  if (!memberId) return;

  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from("project_members")
    .select("project_id")
    .eq("id", memberId)
    .maybeSingle();
  if (!row) return;
  await requireProjectMember(row.project_id);

  const patch: Record<string, string> = {};
  if (name) patch.name = name;
  if (color) patch.color = color;
  if (Object.keys(patch).length === 0) return;

  await admin.from("project_members").update(patch).eq("id", memberId);
  revalidatePath(`/r/${row.project_id}`, "layout");
}

export async function deleteFamilyMemberAction(formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) return;

  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from("project_members")
    .select("project_id, role")
    .eq("id", memberId)
    .maybeSingle();
  if (!row) return;
  if (row.role === "owner") {
    // 簡易制限：オーナーは削除不可
    throw new Error("オーナーは削除できません");
  }
  await requireProjectMember(row.project_id);

  await admin.from("project_members").delete().eq("id", memberId);
  revalidatePath(`/r/${row.project_id}`, "layout");
}
