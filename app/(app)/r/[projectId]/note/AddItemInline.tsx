"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { addItemAction } from "./actions";

/**
 * 部屋アコーディオン内に置く「＋ 要望を追加」ボタン。
 * 旧 AddItemFAB の縦アコーディオン版。FAB は廃止。
 */
export function AddItemInline({
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
        className="w-full mt-2 mb-1 py-2.5 rounded-[12px] border border-dashed border-accent text-accent bg-accent-soft hover:opacity-90 text-[13px] font-bold tap-44"
      >
        ＋ 要望を追加
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
          className="w-full px-3 py-2.5 text-[15px] bg-surf text-ink rounded-[var(--radius-btn)] border border-line placeholder:text-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft resize-none"
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
