"use client";

import { useTransition } from "react";
import { addItemAction } from "./actions";

export function HintChips({
  roomId,
  hints,
}: {
  roomId: string;
  hints: string[];
}) {
  const [pending, startTransition] = useTransition();

  if (hints.length === 0) return null;

  const add = (text: string) => {
    const fd = new FormData();
    fd.set("roomId", roomId);
    fd.set("text", text);
    startTransition(async () => {
      await addItemAction(fd);
    });
  };

  return (
    <>
      <div className="text-[10.5px] font-bold tracking-[0.1em] text-ink-faint mt-4 mb-2 px-4">
        こんな項目はどう？（タップで追加）
      </div>
      <div className="flex flex-wrap gap-2 px-4">
        {hints.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => add(h)}
            disabled={pending}
            className="border border-dashed border-[#d4c9b6] bg-transparent text-ink-soft text-[12.5px] px-3 py-1.5 rounded-[18px] disabled:opacity-50 tap-44"
          >
            ＋ {h}
          </button>
        ))}
      </div>
    </>
  );
}
