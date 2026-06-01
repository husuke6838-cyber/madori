import { ROOM_TEMPLATES } from "@/lib/seeds";

/**
 * 後悔ポイント💡。
 * 部屋名で seeds から引いて表示する。複数あれば最初の1件のみ。
 */
export function RegretCard({ roomName }: { roomName: string }) {
  const template = ROOM_TEMPLATES.find((t) => t.name === roomName);
  const regret = template?.regrets?.[0];
  if (!regret) return null;

  return (
    <div className="mb-3 flex gap-2 bg-sage-soft border border-[#d6ddc7] rounded-[12px] px-3 py-2.5 text-[12px] leading-[1.5] text-[#46532f]">
      <span className="text-sm flex-shrink-0">💡</span>
      <span>
        <b className="block text-[10px] tracking-wider text-[#5d6b40] mb-0.5">
          よくある後悔ポイント
        </b>
        {regret}
      </span>
    </div>
  );
}
