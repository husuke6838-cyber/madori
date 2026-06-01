"use client";

import { deleteProjectAction } from "@/app/actions/projects";

/**
 * プロジェクトカードの削除ボタン。
 * クライアントコンポーネントとして confirm() を出してから Server Action を実行。
 */
export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  return (
    <form
      action={deleteProjectAction}
      onSubmit={(e) => {
        const ok = window.confirm(
          `「${projectName}」を削除します。\n中の要望・★評価・間取り・記録もすべて削除されます。\n本当によろしいですか？`
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        aria-label="このルームを削除"
        className="tap-44 px-3 py-3 text-ink-faint hover:text-clay active:text-clay text-lg"
      >
        🗑
      </button>
    </form>
  );
}
