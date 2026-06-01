type Member = {
  id: string;
  name: string;
  color: string;
};

/**
 * 家族メンバーのチップ行（表示のみ）。
 * メンバー追加・改名・削除 UI は Phase 1 ④ の後半で追加予定。
 */
export function FamilyChips({ members }: { members: Member[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 pt-3 pb-1">
      {members.map((m) => (
        <span
          key={m.id}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1.5 rounded-full"
          style={{ background: hexToSoft(m.color), color: darken(m.color) }}
        >
          <span
            className="w-[7px] h-[7px] rounded-full"
            style={{ background: m.color }}
          />
          {m.name}
        </span>
      ))}
    </div>
  );
}

function hexToSoft(hex: string) {
  // 単純に背景透過率を上げたソフト色（#xxxxxx + 22 = alpha 0.13）
  return hex.replace(/^#/, "#") + "22";
}

function darken(hex: string) {
  // テキスト色用に少し暗めにする（RGBの各値を 0.7 倍）
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dr = Math.round(r * 0.7);
  const dg = Math.round(g * 0.7);
  const db = Math.round(b * 0.7);
  return `rgb(${dr},${dg},${db})`;
}
