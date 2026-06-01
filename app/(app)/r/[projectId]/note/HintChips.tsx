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
      <div className="text-[10px] font-bold tracking-[0.1em] text-faint mt-3 mb-1.5">
        こんな項目はどう？（タップで追加）
      </div>
      <div className="flex flex-wrap gap-1.5">
        {hints.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => add(h)}
            disabled={pending}
            className="border border-dashed border-line bg-transparent text-soft text-[12px] px-2.5 py-1 rounded-full disabled:opacity-50 tap-44"
          >
            ＋ {h}
          </button>
        ))}
      </div>
    </>
  );
}
