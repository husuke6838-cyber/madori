"use client";

import { useState, useTransition } from "react";
import { deleteProjectAction } from "@/app/actions/projects";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

/**
 * プロジェクトカードの削除ボタン。
 * 🗑タップでアプリ内モーダルを開き、明示的に「削除する」を押した時だけ実行する。
 */
export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    const fd = new FormData();
    fd.set("projectId", projectId);
    startTransition(async () => {
      await deleteProjectAction(fd);
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label="このルームを削除"
        onClick={() => setOpen(true)}
        className="tap-44 px-3 py-3 text-ink-faint hover:text-clay active:text-clay text-lg"
      >
        🗑
      </button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="このルームを削除しますか？"
      >
        <p className="text-sm text-ink-soft leading-relaxed">
          <span className="font-bold text-ink">「{projectName}」</span>{" "}
          を削除します。
          <br />
          中の<b>要望・★評価・間取り・打ち合わせ記録</b>もすべて削除され、元に戻せません。
        </p>

        <div className="mt-5 flex gap-2.5">
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
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-[15px] font-bold rounded-[var(--radius-btn)] bg-[#b1462b] text-white shadow-[0_4px_12px_rgba(177,70,43,0.32)] disabled:opacity-50 tap-44"
          >
            {pending ? "削除中..." : "削除する"}
          </button>
        </div>
      </Modal>
    </>
  );
}
