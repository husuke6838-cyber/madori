"use client";

import { useTransition } from "react";
import { cn } from "@/lib/ui";
import { toggleNoRequestAction } from "./actions";

export function NoRequestCheck({
  roomId,
  checked,
}: {
  roomId: string;
  checked: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const fd = new FormData();
    fd.set("roomId", roomId);
    startTransition(async () => {
      await toggleNoRequestAction(fd);
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "w-full flex items-center gap-2.5 px-3.5 py-3 border border-dashed border-line rounded-[13px] bg-surface-2 text-[13px] mx-4 mt-3 tap-44",
        checked ? "text-ink-faint line-through" : "text-ink-soft",
        pending && "opacity-50"
      )}
      style={{ width: "calc(100% - 2rem)" }}
    >
      <span
        className={cn(
          "w-[19px] h-[19px] rounded-md border-[1.5px] grid place-items-center text-[13px] text-white flex-shrink-0",
          checked ? "bg-sage border-sage" : "border-ink-faint"
        )}
      >
        {checked ? "✓" : ""}
      </span>
      この場所は特に要望なし（確認済み）
    </button>
  );
}
