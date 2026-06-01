"use client";

import { useOptimistic, useTransition } from "react";
import { cn } from "@/lib/ui";
import { toggleNoRequestAction } from "./actions";

export function NoRequestCheck({
  roomId,
  checked,
}: {
  roomId: string;
  checked: boolean;
}) {
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(
    checked,
    (_state: boolean, next: boolean) => next
  );
  const [, startTransition] = useTransition();

  const toggle = () => {
    const fd = new FormData();
    fd.set("roomId", roomId);
    startTransition(async () => {
      setOptimisticChecked(!optimisticChecked);
      await toggleNoRequestAction(fd);
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "w-full flex items-center gap-2.5 px-3.5 py-2.5 border border-dashed border-line rounded-[13px] bg-bg text-[12.5px] mt-3 tap-44",
        optimisticChecked ? "text-faint line-through" : "text-soft"
      )}
    >
      <span
        className={cn(
          "w-[19px] h-[19px] rounded-md border-[1.5px] grid place-items-center text-[13px] text-white flex-shrink-0",
          optimisticChecked ? "bg-sage border-sage" : "border-faint"
        )}
      >
        {optimisticChecked ? "✓" : ""}
      </span>
      この場所は特に要望なし（確認済み）
    </button>
  );
}
