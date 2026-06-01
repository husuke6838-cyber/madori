"use server";

import { revalidatePath } from "next/cache";
import { requireProjectMember } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function addMeetingLogAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const logDate = String(formData.get("log_date") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const saidUs = String(formData.get("said_us") ?? "").trim() || null;
  const saidThem = String(formData.get("said_them") ?? "").trim() || null;
  const status =
    (String(formData.get("status") ?? "done") as "done" | "planned") || "done";
  if (!projectId || !logDate || !title) return;

  const { admin } = await requireProjectMember(projectId);

  // 末尾追加
  const { data: maxRow } = await admin
    .from("meeting_logs")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  await admin.from("meeting_logs").insert({
    project_id: projectId,
    log_date: logDate,
    title,
    said_us: saidUs,
    said_them: saidThem,
    status,
    sort_order: nextOrder,
  });

  revalidatePath(`/r/${projectId}/log`);
}

export async function updateMeetingLogAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const logDate = String(formData.get("log_date") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const saidUs = String(formData.get("said_us") ?? "").trim() || null;
  const saidThem = String(formData.get("said_them") ?? "").trim() || null;
  const status =
    (String(formData.get("status") ?? "done") as "done" | "planned") || "done";
  if (!id || !projectId || !logDate || !title) return;

  const { admin } = await requireProjectMember(projectId);
  await admin
    .from("meeting_logs")
    .update({
      log_date: logDate,
      title,
      said_us: saidUs,
      said_them: saidThem,
      status,
    })
    .eq("id", id)
    .eq("project_id", projectId);

  revalidatePath(`/r/${projectId}/log`);
}

export async function deleteMeetingLogAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from("meeting_logs")
    .select("project_id")
    .eq("id", id)
    .maybeSingle();
  if (!row) return;
  await requireProjectMember(row.project_id);
  await admin.from("meeting_logs").delete().eq("id", id);

  revalidatePath(`/r/${row.project_id}/log`);
}

export async function toggleMeetingLogStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from("meeting_logs")
    .select("project_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!row) return;
  await requireProjectMember(row.project_id);

  await admin
    .from("meeting_logs")
    .update({ status: row.status === "done" ? "planned" : "done" })
    .eq("id", id);

  revalidatePath(`/r/${row.project_id}/log`);
}
