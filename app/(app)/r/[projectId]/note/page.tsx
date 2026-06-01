import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ROOM_TEMPLATES } from "@/lib/seeds";
import { FamilyChips } from "./FamilyChips";
import { RoomSection } from "./RoomSection";
import { type ItemForCard } from "./ItemCard";

type ItemRow = {
  id: string;
  room_id: string;
  text: string;
  memo: string | null;
  spec_model: string | null;
  sort_order: number;
  ratings: { member_id: string; stars: number }[];
  item_revisions: { prev_text: string; changed_at: string }[];
  item_images: { id: string; storage_path: string; sort_order: number }[];
  item_links: {
    id: string;
    url: string;
    og_title: string | null;
    og_image: string | null;
    og_desc: string | null;
    sort_order: number;
  }[];
};

export default async function NoteTab({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ sort?: string; open?: string }>;
}) {
  const { projectId } = await params;
  const { sort, open } = await searchParams;
  await requireUser();

  const admin = createSupabaseAdminClient();

  const { data: project } = await admin
    .from("projects")
    .select(
      `id, name,
       project_members ( id, name, color, sort_order ),
       rooms ( id, name, subtitle, kind, desired_jou, no_request, sort_order )`
    )
    .eq("id", projectId)
    .single();

  if (!project) {
    return (
      <main className="px-5 py-10 text-center text-soft">
        ルームが見つかりません
      </main>
    );
  }

  const members = (
    (project.project_members ?? []) as Array<{
      id: string;
      name: string;
      color: string;
      sort_order: number;
    }>
  )
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  const rooms = (
    (project.rooms ?? []) as Array<{
      id: string;
      name: string;
      subtitle: string | null;
      kind: string;
      desired_jou: number | null;
      no_request: boolean;
      sort_order: number;
    }>
  )
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  if (rooms.length === 0) {
    return (
      <main className="px-5 py-10 text-center text-soft">
        ルームを準備中です…
      </main>
    );
  }

  // 全部屋分の items を一括取得
  const { data: items } = await admin
    .from("items")
    .select(
      `id, room_id, text, memo, spec_model, sort_order,
       ratings ( member_id, stars ),
       item_revisions ( prev_text, changed_at ),
       item_images ( id, storage_path, sort_order ),
       item_links ( id, url, og_title, og_image, og_desc, sort_order )`
    )
    .in("room_id", rooms.map((r) => r.id))
    .order("sort_order");

  const itemList = (items ?? []) as unknown as ItemRow[];

  // 画像 URL 一括署名
  const allImagePaths = itemList.flatMap((it) =>
    it.item_images.map((im) => im.storage_path)
  );
  const signedUrlByPath: Record<string, string> = {};
  if (allImagePaths.length > 0) {
    const { data: signed } = await admin.storage
      .from("item-images")
      .createSignedUrls(allImagePaths, 60 * 60);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) signedUrlByPath[s.path] = s.signedUrl;
    }
  }

  // 部屋ID → ItemForCard[]
  const itemsByRoom: Record<string, ItemForCard[]> = {};
  for (const it of itemList) {
    (itemsByRoom[it.room_id] ??= []).push({
      id: it.id,
      text: it.text,
      memo: it.memo,
      specModel: it.spec_model,
      ratings: it.ratings ?? [],
      prevTexts: (it.item_revisions ?? [])
        .sort(
          (a, b) =>
            new Date(a.changed_at).getTime() -
            new Date(b.changed_at).getTime()
        )
        .map((r) => r.prev_text),
      images: (it.item_images ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((im) => ({
          id: im.id,
          signedUrl: signedUrlByPath[im.storage_path] ?? null,
        })),
      links: (it.item_links ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((l) => ({
          id: l.id,
          url: l.url,
          og_title: l.og_title,
          og_image: l.og_image,
          og_desc: l.og_desc,
        })),
    });
  }

  const sortByStars = sort === "stars";
  const openIds = new Set(
    (open ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  // 進捗：要望あり OR 「要望なし✓」の部屋を「完了」とみなす
  const completed = rooms.filter(
    (r) => (itemsByRoom[r.id]?.length ?? 0) > 0 || r.no_request
  ).length;
  const totalRooms = rooms.length;
  const progressPct = Math.round((completed / totalRooms) * 100);

  return (
    <main className="pb-32 max-w-md mx-auto md:max-w-lg">
      <FamilyChips projectId={projectId} members={members} />

      {/* 進捗バー */}
      <div className="px-4 mt-2 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11.5px] font-bold text-soft tracking-wide">
            記入の進みぐあい
          </span>
          <span className="text-[11.5px] font-bold text-ink">
            {completed} <span className="text-faint font-medium">/</span>{" "}
            {totalRooms} 部屋
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-line overflow-hidden">
          <div
            className="h-full bg-accent transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 部屋アコーディオン */}
      <div className="px-3 space-y-2">
        {rooms.map((room, i) => {
          const roomItems = itemsByRoom[room.id] ?? [];
          const sortedItems = sortByStars
            ? [...roomItems].sort(
                (a, b) =>
                  b.ratings.reduce((s, r) => s + r.stars, 0) -
                  a.ratings.reduce((s, r) => s + r.stars, 0)
              )
            : roomItems;
          const template = ROOM_TEMPLATES.find((t) => t.name === room.name);
          const isOpen =
            openIds.size > 0 ? openIds.has(room.id) : i === 0; // 既定: 先頭のみ開く

          return (
            <RoomSection
              key={room.id}
              room={room}
              items={sortedItems}
              members={members}
              hints={template?.hints ?? []}
              defaultOpen={isOpen}
              projectId={projectId}
              sortByStars={sortByStars}
            />
          );
        })}
      </div>
    </main>
  );
}
