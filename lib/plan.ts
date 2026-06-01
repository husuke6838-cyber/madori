import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlanMember, PlanRoom, PlanItem } from "@/components/PlanDocument";

/**
 * 計画書ドキュメントに必要なデータ一式をまとめて取得する。
 * - in-app の plan タブ
 * - 公開共有 /share/[token]
 * の両方で再利用する。
 */
export async function loadPlanData(projectId: string): Promise<{
  projectName: string;
  members: PlanMember[];
  rooms: PlanRoom[];
} | null> {
  const admin = createSupabaseAdminClient();

  const [projectRes, membersRes, roomsRes] = await Promise.all([
    admin.from("projects").select("id, name").eq("id", projectId).maybeSingle(),
    admin
      .from("project_members")
      .select("id, name, color, sort_order")
      .eq("project_id", projectId)
      .order("sort_order"),
    admin
      .from("rooms")
      .select(
        `id, name, desired_jou, no_request, sort_order,
         items (
           id, text, memo, sort_order,
           ratings ( member_id, stars ),
           item_images ( storage_path, sort_order ),
           item_links ( url, og_title, sort_order )
         )`
      )
      .eq("project_id", projectId)
      .order("sort_order"),
  ]);

  if (!projectRes.data) return null;

  const members = (membersRes.data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    color: m.color,
  }));

  // 画像の署名URLを一括発行
  type RoomRow = {
    id: string;
    name: string;
    desired_jou: number | null;
    no_request: boolean;
    items: {
      id: string;
      text: string;
      memo: string | null;
      sort_order: number;
      ratings: { member_id: string; stars: number }[];
      item_images: { storage_path: string; sort_order: number }[];
      item_links: { url: string; og_title: string | null; sort_order: number }[];
    }[];
  };
  const roomsData = (roomsRes.data ?? []) as unknown as RoomRow[];
  const allPaths = roomsData.flatMap((r) =>
    r.items.flatMap((i) => i.item_images.map((im) => im.storage_path))
  );
  const signedUrlByPath: Record<string, string> = {};
  if (allPaths.length > 0) {
    const { data: signed } = await admin.storage
      .from("item-images")
      .createSignedUrls(allPaths, 60 * 60 * 24); // 24h（印刷時に切れにくいよう少し長め）
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) signedUrlByPath[s.path] = s.signedUrl;
    }
  }

  const rooms: PlanRoom[] = roomsData.map((r) => ({
    id: r.id,
    name: r.name,
    desired_jou: r.desired_jou,
    no_request: r.no_request,
    items: r.items
      .sort((a, b) => a.sort_order - b.sort_order)
      .map<PlanItem>((it) => ({
        id: it.id,
        text: it.text,
        memo: it.memo,
        ratings: it.ratings ?? [],
        linkTitles: (it.item_links ?? [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((l) => l.og_title || l.url),
        imageUrls: (it.item_images ?? [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((im) => signedUrlByPath[im.storage_path])
          .filter((u): u is string => !!u),
      })),
  }));

  return {
    projectName: projectRes.data.name,
    members,
    rooms,
  };
}
