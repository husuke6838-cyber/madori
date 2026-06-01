import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ROOM_TEMPLATES } from "@/lib/seeds";
import { FamilyChips } from "./FamilyChips";
import { RoomTabs } from "./RoomTabs";
import { RegretCard } from "./RegretCard";
import { ItemCard } from "./ItemCard";
import { AddItemFAB } from "./AddItemFAB";
import { HintChips } from "./HintChips";
import { NoRequestCheck } from "./NoRequestCheck";
import { SortToggle } from "./SortToggle";

type ItemRow = {
  id: string;
  text: string;
  memo: string | null;
  sort_order: number;
  ratings: { member_id: string; stars: number }[];
  item_revisions: { prev_text: string; changed_at: string }[];
};

export default async function NoteTab({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ room?: string; sort?: string }>;
}) {
  const { projectId } = await params;
  const { room: roomQuery, sort } = await searchParams;
  await requireUser();

  // 読み取りは admin（user-scoped client での RLS 経路の差異を回避）。
  // メンバーシップは layout で既にチェック済みなのでここでは省略可。
  const admin = createSupabaseAdminClient();

  const [projectRes, membersRes, roomsRes] = await Promise.all([
    admin.from("projects").select("id, name").eq("id", projectId).single(),
    admin
      .from("project_members")
      .select("id, name, color")
      .eq("project_id", projectId)
      .order("sort_order"),
    admin
      .from("rooms")
      .select("id, name, subtitle, kind, desired_jou, no_request, sort_order")
      .eq("project_id", projectId)
      .order("sort_order"),
  ]);

  const project = projectRes.data;
  const members = membersRes.data ?? [];
  const rooms = roomsRes.data ?? [];

  if (!project || rooms.length === 0) {
    return (
      <main className="px-5 py-10 text-center text-ink-soft">
        ルームを準備中です…
      </main>
    );
  }

  const currentRoom =
    rooms.find((r) => r.id === roomQuery) ?? rooms[0];

  // 各部屋の要望件数（タブのインジケータ用）
  const { data: itemCountRows } = await admin
    .from("items")
    .select("room_id")
    .in(
      "room_id",
      rooms.map((r) => r.id)
    );
  const itemCounts: Record<string, number> = {};
  for (const row of itemCountRows ?? []) {
    itemCounts[row.room_id] = (itemCounts[row.room_id] ?? 0) + 1;
  }

  // 現在の部屋の要望（並び順 or ★順）
  const { data: items } = await admin
    .from("items")
    .select(
      `id, text, memo, sort_order,
       ratings ( member_id, stars ),
       item_revisions ( prev_text, changed_at )`
    )
    .eq("room_id", currentRoom.id)
    .order("sort_order");

  const itemList = (items ?? []) as unknown as ItemRow[];

  const sortByStars = sort === "stars";
  const sortedItems = sortByStars
    ? [...itemList].sort(
        (a, b) =>
          b.ratings.reduce((s, r) => s + r.stars, 0) -
          a.ratings.reduce((s, r) => s + r.stars, 0)
      )
    : itemList;

  const template = ROOM_TEMPLATES.find((t) => t.name === currentRoom.name);
  const hints = template?.hints ?? [];

  return (
    <>
      <FamilyChips members={members} />
      <RoomTabs
        rooms={rooms}
        currentRoomId={currentRoom.id}
        projectId={projectId}
        itemCounts={itemCounts}
      />

      <div className="px-4 pt-1 pb-2 flex items-end gap-2">
        <span className="font-mincho text-[25px]">{currentRoom.name}</span>
        {currentRoom.desired_jou && (
          <span className="text-[11px] font-bold text-[#9c6a3a] bg-[#f6ead9] border border-[#ecd6bd] px-2.5 py-1 rounded-[14px] mb-1">
            希望 {currentRoom.desired_jou}帖
          </span>
        )}
        <div className="ml-auto mb-1">
          <SortToggle
            projectId={projectId}
            roomId={currentRoom.id}
            sortByStars={sortByStars}
          />
        </div>
      </div>
      <div className="px-4 text-[12.5px] text-ink-soft mb-3">
        {currentRoom.subtitle ?? "理想を書きためよう"}
      </div>

      <RegretCard roomName={currentRoom.name} />

      <div className="px-4">
        {sortedItems.length === 0 && !currentRoom.no_request && (
          <div className="text-center py-6 px-4 text-[13px] text-ink-faint border border-dashed border-line rounded-[14px] bg-surface-2 mb-3">
            まだ要望がありません。
            <br />
            右下の ＋ ボタン、または下のヒントから追加できます ✏️
          </div>
        )}

        {sortedItems.map((it) => (
          <ItemCard
            key={it.id}
            item={{
              id: it.id,
              text: it.text,
              memo: it.memo,
              ratings: it.ratings ?? [],
              prevTexts: (it.item_revisions ?? [])
                .sort(
                  (a, b) =>
                    new Date(a.changed_at).getTime() -
                    new Date(b.changed_at).getTime()
                )
                .map((r) => r.prev_text),
            }}
            members={members}
          />
        ))}
      </div>

      <NoRequestCheck
        roomId={currentRoom.id}
        checked={currentRoom.no_request}
      />

      <HintChips roomId={currentRoom.id} hints={hints} />

      <AddItemFAB roomId={currentRoom.id} roomName={currentRoom.name} />
    </>
  );
}
