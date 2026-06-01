"use client";

import { useTransition } from "react";
import { cn } from "@/lib/ui";
import {
  deleteItemAction,
  setRatingAction,
} from "./actions";

type Member = { id: string; name: string; color: string };
type Rating = { member_id: string; stars: number };

export function ItemCard({
  item,
  members,
}: {
  item: {
    id: string;
    text: string;
    memo: string | null;
    ratings: Rating[];
    prevTexts: string[];
  };
  members: Member[];
}) {
  const [pending, startTransition] = useTransition();

  const total = item.ratings.reduce((s, r) => s + r.stars, 0);
  const avg = members.length ? total / members.length : 0;
  const lvl =
    avg >= 2.5 ? "border-l-clay" : avg >= 1.5 ? "border-l-[#d3a26a]" : "border-l-line";

  const ratingByMember: Record<string, number> = {};
  for (const r of item.ratings) ratingByMember[r.member_id] = r.stars;

  const setStar = (memberId: string, stars: number) => {
    const current = ratingByMember[memberId] ?? 0;
    // 同じ値をタップで -1 トグル
    const next = current === stars ? stars - 1 : stars;
    const fd = new FormData();
    fd.set("itemId", item.id);
    fd.set("memberId", memberId);
    fd.set("stars", String(Math.max(0, next)));
    startTransition(async () => {
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

  return (
    <div
      className={cn(
        "bg-surface border border-line border-l-[3px] rounded-[var(--radius-card)] px-4 py-3.5 mb-3 shadow-[0_5px_14px_rgba(60,45,30,0.05)]",
        lvl,
        pending && "opacity-60"
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

      <div className="flex items-start gap-2">
        <div className="text-[15px] font-medium leading-snug flex-1">
          {item.text}
          {item.prevTexts.length > 0 && (
            <span className="ml-1.5 inline-block text-[9.5px] font-bold text-clay bg-clay-soft rounded-[10px] px-1.5 align-middle">
              変更あり
            </span>
          )}
        </div>
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
                      style={{
                        color: on ? m.color : "#dcd2c2",
                      }}
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

      {item.memo && (
        <div className="text-[12.5px] text-ink-soft mt-2.5">
          <span className="text-[10px] font-bold tracking-wider text-ink-faint mr-1">
            メモ
          </span>
          {item.memo}
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
