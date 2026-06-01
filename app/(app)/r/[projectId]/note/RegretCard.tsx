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
    <div className="mx-4 mb-3.5 flex gap-2.5 bg-sage-soft border border-[#d6ddc7] rounded-[13px] px-3.5 py-3 text-[12.5px] leading-[1.5] text-[#46532f]">
      <span className="text-base flex-shrink-0">💡</span>
      <span>
        <b className="block text-[10.5px] tracking-wider text-[#5d6b40] mb-0.5">
          よくある後悔ポイント
        </b>
        {regret}
      </span>
    </div>
  );
}
