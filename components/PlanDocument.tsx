import { DISCLAIMER_COST, DISCLAIMER_PLAN } from "@/lib/constants";

export type PlanMember = { id: string; name: string; color: string };
export type PlanItem = {
  id: string;
  text: string;
  memo: string | null;
  ratings: { member_id: string; stars: number }[];
  linkTitles: string[];
  imageUrls: string[];
};
export type PlanRoom = {
  id: string;
  name: string;
  desired_jou: number | null;
  no_request: boolean;
  items: PlanItem[];
};
export type PlanFloorplan = {
  id: string;
  name: string;
  pngUrl: string | null;
};

/**
 * 計画書ドキュメントの表示（読み取り専用）。
 * - 部屋ごと、要望は★合計の高い順に並ぶ
 * - 印刷用 CSS（@media print）と整合
 * - 共有リンクの公開ビューも同じものを使う
 */
export function PlanDocument({
  projectName,
  members,
  rooms,
  floorplans = [],
  generatedAt,
}: {
  projectName: string;
  members: PlanMember[];
  rooms: PlanRoom[];
  floorplans?: PlanFloorplan[];
  generatedAt: Date;
}) {
  const dateStr = generatedAt.toLocaleDateString("ja-JP");
  const totalStars = (item: PlanItem) =>
    item.ratings.reduce((s, r) => s + r.stars, 0);

  return (
    <article className="px-5 py-6 print:p-0">
      <header className="text-center border-b-2 border-ink pb-3.5 mb-3">
        <h1 className="font-mincho text-[21px]">家づくり計画書</h1>
        <div className="text-[11.5px] text-ink-soft mt-1">
          {projectName} ／ {dateStr} 時点
        </div>
      </header>

      <div className="flex justify-center gap-3.5 text-[11px] mb-1">
        {members.map((m) => (
          <span key={m.id} className="font-bold" style={{ color: darken(m.color) }}>
            ■ {m.name}
          </span>
        ))}
      </div>

      {rooms.map((room) => {
        if (room.items.length === 0 && !room.no_request) return null;

        const sortedItems = [...room.items].sort(
          (a, b) => totalStars(b) - totalStars(a)
        );

        return (
          <section key={room.id} className="mt-5 break-inside-avoid">
            <h2 className="font-mincho text-[15.5px] border-l-4 border-clay pl-2.5 mb-2">
              {room.name}
              {room.desired_jou && (
                <span className="ml-2 text-[11px] text-ink-soft font-sans">
                  希望 {room.desired_jou}帖
                </span>
              )}
            </h2>

            {room.items.length === 0 && room.no_request && (
              <div className="text-[12px] text-ink-soft italic py-2">
                この場所は特に要望なし（家族で確認済み）
              </div>
            )}

            {sortedItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-2.5 py-2 border-b border-dotted border-line break-inside-avoid"
              >
                <div className="flex-shrink-0 text-[11px] flex flex-col gap-0.5 min-w-[110px]">
                  {members.map((m) => {
                    const rating =
                      item.ratings.find((r) => r.member_id === m.id)?.stars ?? 0;
                    return (
                      <span
                        key={m.id}
                        className="font-bold"
                        style={{ color: darken(m.color) }}
                      >
                        {m.name}：{stars(rating)}
                      </span>
                    );
                  })}
                </div>
                <div className="text-[13px] leading-snug flex-1">
                  {item.text}
                  {item.memo && (
                    <div className="text-[11px] text-ink-soft mt-1">
                      💭 {item.memo}
                    </div>
                  )}
                  {item.linkTitles.length > 0 && (
                    <div className="mt-1 text-[11px] text-clay">
                      {item.linkTitles.map((t, i) => (
                        <div key={i}>🔗 {t}</div>
                      ))}
                    </div>
                  )}
                  {item.imageUrls.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.imageUrls.map((u, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={u}
                          alt=""
                          className="w-16 h-16 object-cover rounded border border-line"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        );
      })}

      {floorplans.some((f) => f.pngUrl) && (
        <section className="mt-6 break-inside-avoid">
          <h2 className="font-mincho text-[15.5px] border-l-4 border-clay pl-2.5 mb-3">
            間取り
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {floorplans
              .filter((f) => f.pngUrl)
              .map((f) => (
                <figure
                  key={f.id}
                  className="text-center break-inside-avoid"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.pngUrl!}
                    alt={`間取り ${f.name}`}
                    className="w-full max-w-[480px] mx-auto border border-line rounded-md"
                  />
                  <figcaption className="text-[11px] text-ink-soft mt-1">
                    {f.name}
                  </figcaption>
                </figure>
              ))}
          </div>
        </section>
      )}

      <footer className="mt-8 text-[10px] text-ink-faint leading-relaxed border-t border-line pt-3 print:mt-6">
        <p>※ {DISCLAIMER_PLAN}</p>
        <p className="mt-1">※ {DISCLAIMER_COST}</p>
      </footer>
    </article>
  );
}

function stars(v: number) {
  return "★".repeat(v) + "☆".repeat(3 - v);
}

function darken(hex: string) {
  if (!hex.startsWith("#")) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * 0.6)},${Math.round(g * 0.6)},${Math.round(b * 0.6)})`;
}
