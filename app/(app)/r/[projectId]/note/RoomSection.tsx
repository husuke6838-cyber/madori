import { ItemCard, type ItemForCard } from "./ItemCard";
import { RegretCard } from "./RegretCard";
import { NoRequestCheck } from "./NoRequestCheck";
import { HintChips } from "./HintChips";
import { AddItemInline } from "./AddItemInline";
import { SortToggle } from "./SortToggle";

type Room = {
  id: string;
  name: string;
  subtitle: string | null;
  kind: string;
  desired_jou: number | null;
  no_request: boolean;
  sort_order: number;
};

type Member = { id: string; name: string; color: string };

/**
 * 1部屋分の縦アコーディオン要素。
 * - <details>/<summary> でアクセシブルかつ JS なしの開閉
 * - 既定 open=先頭のみ
 * - 閉時：★最多要望の1行プレビューを表示
 */
export function RoomSection({
  room,
  items,
  members,
  hints,
  defaultOpen,
  projectId,
  sortByStars,
}: {
  room: Room;
  items: ItemForCard[];
  members: Member[];
  hints: string[];
  defaultOpen: boolean;
  projectId: string;
  sortByStars: boolean;
}) {
  const itemCount = items.length;
  const status: "filled" | "noneOk" | "empty" =
    itemCount > 0 ? "filled" : room.no_request ? "noneOk" : "empty";

  // ★合計が最大の要望（同点なら最初に出てきたほう）
  const topItem =
    itemCount > 0
      ? items.reduce((best, cur) => {
          const s1 = best.ratings.reduce((s, r) => s + r.stars, 0);
          const s2 = cur.ratings.reduce((s, r) => s + r.stars, 0);
          return s2 > s1 ? cur : best;
        }, items[0])
      : null;

  return (
    <details
      open={defaultOpen}
      className="bg-surf border border-line rounded-2xl overflow-hidden transition-shadow open:shadow-[0_5px_18px_rgba(0,0,0,0.04)]"
    >
      <summary className="list-none cursor-pointer select-none px-4 py-3 flex items-center gap-2.5 tap-44">
        <span
          aria-hidden="true"
          className="acc-chevron text-faint text-[11px] transition-transform duration-200 flex-shrink-0"
        >
          ▶
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mincho text-[17px] font-bold text-ink truncate">
              {room.name}
            </span>
            <StatusBadge status={status} count={itemCount} />
            {room.desired_jou && (
              <span className="text-[10px] font-bold text-accent bg-accent-soft border border-accent-soft px-2 py-0.5 rounded-full">
                希望 {room.desired_jou}帖
              </span>
            )}
          </div>

          {topItem && (
            <div className="acc-preview text-[12px] text-soft mt-1 truncate">
              <span className="text-accent">★</span> {topItem.text}
            </div>
          )}
          {!topItem && room.subtitle && (
            <div className="acc-preview text-[11.5px] text-faint mt-0.5 truncate">
              {room.subtitle}
            </div>
          )}
        </div>
      </summary>

      {/* 中身 */}
      <div className="px-3 pb-4 pt-1">
        {room.subtitle && (
          <div className="text-[12px] text-soft mb-2.5 px-1">
            {room.subtitle}
          </div>
        )}

        <div className="flex justify-end mb-2 px-1">
          <SortToggle
            projectId={projectId}
            roomId={room.id}
            sortByStars={sortByStars}
          />
        </div>

        <RegretCard roomName={room.name} />

        {itemCount === 0 && !room.no_request && (
          <div className="text-center py-5 px-4 text-[12.5px] text-faint border border-dashed border-line rounded-[14px] bg-bg mb-3">
            まだ要望がありません。
            <br />
            下の ＋ 追加 ボタン、またはヒントから書いてみよう ✏️
          </div>
        )}

        {items.map((it) => (
          <ItemCard key={it.id} item={it} members={members} compact />
        ))}

        <AddItemInline roomId={room.id} roomName={room.name} />

        <NoRequestCheck roomId={room.id} checked={room.no_request} />

        <HintChips roomId={room.id} hints={hints} />
      </div>
    </details>
  );
}

function StatusBadge({
  status,
  count,
}: {
  status: "filled" | "noneOk" | "empty";
  count: number;
}) {
  if (status === "filled") {
    return (
      <span className="text-[10.5px] font-extrabold text-accent bg-accent-soft px-2 py-0.5 rounded-full">
        要望 {count}
      </span>
    );
  }
  if (status === "noneOk") {
    return (
      <span className="text-[10.5px] font-bold text-sage bg-sage-soft px-2 py-0.5 rounded-full">
        要望なし ✓
      </span>
    );
  }
  return (
    <span className="text-[10.5px] font-bold text-faint bg-bg border border-line px-2 py-0.5 rounded-full">
      未記入
    </span>
  );
}
