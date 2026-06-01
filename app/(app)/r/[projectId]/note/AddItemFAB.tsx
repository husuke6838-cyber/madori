"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { addItemAction } from "./actions";

export function AddItemFAB({
  roomId,
  roomName,
}: {
  roomId: string;
  roomName: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const fd = new FormData();
    fd.set("roomId", roomId);
    fd.set("text", trimmed);
    startTransition(async () => {
      await addItemAction(fd);
      setText("");
      setOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="要望を追加"
        className="fixed right-5 bottom-24 z-20 w-14 h-14 rounded-2xl text-white text-2xl font-bold shadow-[0_12px_24px_-7px_rgba(189,93,58,0.55)] bg-gradient-to-br from-clay to-[#a84e30] grid place-items-center"
      >
        ＋
      </button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title={`「${roomName}」に要望を追加`}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          autoFocus
          placeholder="例: 玄関は南向きにしたい / コンセントを多めに / ……"
          className="w-full px-3 py-2.5 text-[15px] bg-surface text-ink rounded-[var(--radius-btn)] border border-line placeholder:text-ink-faint focus:outline-none focus:border-clay focus:ring-2 focus:ring-clay-soft resize-none"
        />
        <div className="mt-3.5 flex gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1"
            onClick={handleAdd}
            disabled={pending || !text.trim()}
          >
            {pending ? "追加中..." : "追加する"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
