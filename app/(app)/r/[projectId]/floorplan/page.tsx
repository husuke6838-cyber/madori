import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FloorplanData } from "@/lib/floorplan";
import { EMPTY_FLOORPLAN } from "@/lib/floorplan";
import { FloorplanEditor } from "./FloorplanEditor";
import { FloorplanEmptyState } from "./FloorplanEmptyState";

export default async function FloorplanTab({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ fp?: string; error?: string }>;
}) {
  const { projectId } = await params;
  const { fp, error } = await searchParams;
  await requireUser();

  const admin = createSupabaseAdminClient();

  const { data: floorplans } = await admin
    .from("floorplans")
    .select("id, name, grid_unit_mm, data, sort_order, updated_at")
    .eq("project_id", projectId)
    .order("sort_order");

  const list = floorplans ?? [];

  if (list.length === 0) {
    return <FloorplanEmptyState projectId={projectId} error={error} />;
  }

  const current = list.find((f) => f.id === fp) ?? list[0];

  return (
    <FloorplanEditor
      projectId={projectId}
      floorplans={list.map((f) => ({
        id: f.id,
        name: f.name,
      }))}
      current={{
        id: current.id,
        name: current.name,
        gridUnitMm: current.grid_unit_mm,
        data: ((current.data as FloorplanData) ?? null) || EMPTY_FLOORPLAN,
      }}
      error={error}
    />
  );
}
