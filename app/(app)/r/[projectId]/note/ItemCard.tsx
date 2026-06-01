"use client";

import { useOptimistic, useState, useTransition } from "react";
import { cn } from "@/lib/ui";
import { Button } from "@/components/ui/Button";
import {
  deleteItemAction,
  setRatingAction,
  updateItemTextAction,
  updateItemMemoAction,
  updateItemSpecAction,
} from "./actions";
import { ItemAttachments } from "./ItemAttachments";

type Member = { id: string; name: string; color: string };
type Rating = { member_id: string; stars: number };

export type ItemForCard = {
  id: string;
  text: string;
  memo: string | null;
  specModel: string | null;
  ratings: Rating[];
  prevTexts: string[];
  images: { id: string; signedUrl: string | null }[];
  links: {
    id: string;
    url: string;
    og_title: string | null;
    og_image: string | null;
    og_desc: string | null;
  }[];
};

export function ItemCard({
  item,
  members,
}: {
  item: ItemForCard;
  members: Member[];
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const [memo, setMemo] = useState(item.memo ?? "");
  const [spec, setSpec] = useState(item.specModel ?? "");
  const [pending, startTransition] = useTransition();

  // 楽観的更新：★クリック直後に画面を更新、サーバ書き込みは裏で
  const [optimisticRatings, applyOptimisticRating] = useOptimistic(
    item.ratings,
    (state: Rating[], change: { memberId: string; stars: number }) => {
      const others = state.filter((r) => r.member_id !== change.memberId);
      if (change.stars === 0) return others;
      return [...others, { member_id: change.memberId, stars: change.stars }];
    }
  );

  const total = optimisticRatings.reduce((s, r) => s + r.stars, 0);
  const avg = members.length ? total / members.length : 0;
  const lvl =
    avg >= 2.5 ? "border-l-clay" : avg >= 1.5 ? "border-l-[#d3a26a]" : "border-l-line";

  const ratingByMember: Record<string, number> = {};
  for (const r of optimisticRatings) ratingByMember[r.member_id] = r.stars;

  const setStar = (memberId: string, stars: number) => {
    const current = ratingByMember[memberId] ?? 0;
    const next = current === stars ? stars - 1 : stars;
    const finalStars = Math.max(0, next);
    const fd = new FormData();
    fd.set("itemId", item.id);
    fd.set("memberId", memberId);
    fd.set("stars", String(finalStars));
    startTransition(async () => {
      applyOptimisticRating({ memberId, stars: finalStars });
      await setRatingAction(fd);
    });
  };

  const handleDelete = () => {
    if (!confirm("この要望を削除しますか？")) return;
    const fd = new FormData();
    fd.set("itemId", item.id);
    startTransition(async () => {
      await deleteItemAction(fd);
    });
  };

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const fd = new FormData();
    fd.set("itemId", item.id);
    fd.set("text", trimmed);
    fd.set("memo", memo.trim());
    fd.set("spec_model", spec.trim());
    startTransition(async () => {
      await updateItemTextAction(fd);
      await updateItemMemoAction(fd);
      await updateItemSpecAction(fd);
      setEditing(false);
    });
  };

  const handleCancel = () => {
    setText(item.text);
    setMemo(item.memo ?? "");
    setSpec(item.specModel ?? "");
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "bg-surface border border-line border-l-[3px] rounded-[var(--radius-card)] px-4 py-3.5 mb-3 shadow-[0_5px_14px_rgba(60,45,30,0.05)] transition-colors",
        lvl
      )}
    >
      {item.prevTexts.length > 0 && (
        <>
          {item.prevTexts.map((p, i) => (
            <div
              key={i}
              className="text-[12.5px] text-ink-faint line-through mb-0.5"
            >
              {p}
            </div>
          ))}
        </>
      )}

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-[15px] bg-surface text-ink rounded-[var(--radius-btn)] border border-line resize-none focus:outline-none focus:border-clay focus:ring-2 focus:ring-clay-soft"
          />
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            placeholder="メモ（任意）：補足や検討中のことなど"
            className="w-full px-3 py-2 text-[13px] text-ink-soft bg-surface-2 rounded-[var(--radius-btn)] border border-line resize-none focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay-soft"
          />
          <input
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            placeholder="型番・仕様（例: LIXIL リシェルSI / 床材 オーク無垢）"
            maxLength={200}
            className="w-full px-3 py-2 text-[12.5px] text-ink-soft bg-surface-2 rounded-[var(--radius-btn)] border border-line focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay-soft"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={pending}
              className="text-xs text-ink-soft px-3 py-2 tap-44"
            >
              キャンセル
            </button>
            <Button
              type="button"
              size="md"
              onClick={handleSave}
              disabled={pending || !text.trim()}
            >
              {pending ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[15px] font-medium leading-snug flex-1 text-left"
          >
            {item.text}
            {item.prevTexts.length > 0 && (
              <span className="ml-1.5 inline-block text-[9.5px] font-bold text-clay bg-clay-soft rounded-[10px] px-1.5 align-middle">
                変更あり
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            aria-label="この要望を削除"
            className="text-ink-faint hover:text-clay px-2 py-1 -mr-2 -mt-1 text-sm"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5 mt-2.5">
        {members.map((m) => {
          const v = ratingByMember[m.id] ?? 0;
          return (
            <div key={m.id} className="flex items-center gap-2">
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded min-w-[54px] text-center"
                style={{
                  background: m.color + "22",
                  color: darken(m.color),
                }}
              >
                {m.name}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3].map((n) => {
                  const on = n <= v;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setStar(m.id, n)}
                      disabled={pending}
                      aria-label={`${m.name} に ★${n}`}
                      className="text-[20px] leading-none px-0.5 tap-44"
                      style={{ color: on ? m.color : "#dcd2c2" }}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <ItemAttachments
        itemId={item.id}
        images={item.images}
        links={item.links}
      />

      {!editing && item.memo && (
        <div className="text-[12.5px] text-ink-soft mt-2.5">
          <span className="text-[10px] font-bold tracking-wider text-ink-faint mr-1">
            メモ
          </span>
          {item.memo}
        </div>
      )}
      {!editing && item.specModel && (
        <div className="text-[12px] text-ink-soft mt-1.5 bg-surface-2 border border-line rounded-md px-2.5 py-1.5">
          <span className="text-[10px] font-bold tracking-wider text-clay mr-1">
            型番・仕様
          </span>
          {item.specModel}
        </div>
      )}
    </div>
  );
}

function darken(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * 0.7)},${Math.round(g * 0.7)},${Math.round(b * 0.7)})`;
}
