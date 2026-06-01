import { PARTNER_LINKS } from "@/lib/constants";

/**
 * 計画書下部のマネタイズ枠（仕様§9.4 のプレースホルダ）。
 * - リンクは lib/constants.ts の PARTNER_LINKS に定義した上で有効化する
 * - 「断定的なアドバイスではなく、家づくりの選択肢提示」のトーン
 */
export function AffiliateNudge() {
  return (
    <aside className="mt-4 bg-sage-soft border border-[#d6ddc7] rounded-[13px] px-4 py-3.5 text-[12px] text-[#4d5a3a] leading-relaxed">
      <strong className="block text-ink text-[13px] mb-1.5">
        家づくり、始めたばかりですか？
      </strong>
      複数の住宅会社のプラン・カタログを無料で取り寄せて比べると、
      <br />
      予算感やデザインのイメージが掴みやすくなります。
      {PARTNER_LINKS.length > 0 ? (
        <ul className="mt-2.5 space-y-1.5">
          {PARTNER_LINKS.map((p) => (
            <li key={p.url}>
              <a
                href={p.url}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="inline-block text-white font-bold text-[12px] bg-sage px-3.5 py-2 rounded-lg no-underline"
              >
                {p.label} →
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-2 text-[11px] text-ink-faint">
          ※ パートナーリンクは後日追加予定です
        </div>
      )}
    </aside>
  );
}
