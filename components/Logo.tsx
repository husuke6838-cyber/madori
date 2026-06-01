/**
 * 「私のおうちカルテ」ブランドロゴ。
 *
 * 構造:
 *  - 角丸の台座（テーマ accent 色に追従）
 *  - おうち（白）
 *  - ハート（accent 色 — 台座と同じで切り抜きのように見える）
 *
 * SVG 内の色を CSS 変数 `--accent` に追従させるため、台座とハートには
 * `fill="currentColor"` を使い、ラッパで `text-accent` を当てる。
 */

export function LogoMark({
  size = 28,
  rounded = 9,
  className = "",
}: {
  size?: number;
  rounded?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-block text-accent ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 96 96"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
      >
        <rect
          width="96"
          height="96"
          rx={(rounded / 28) * 96}
          fill="currentColor"
        />
        <path
          d="M27 47 L48 29 L69 47 V69 a3 3 0 0 1-3 3 H30 a3 3 0 0 1-3-3 Z"
          fill="#ffffff"
        />
        <path
          d="M48 66 C42 60.5 38 57.5 38 53.2 a4.6 4.6 0 0 1 8.4-2.6 a4.6 4.6 0 0 1 8.4 2.6 C54.8 57.5 53.4 60 48 66 Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

/**
 * ヘッダ用ロックアップ（マーク + テキスト2段「私の／おうちカルテ」）
 */
export function LogoLockup({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const mark = size === "sm" ? 26 : 30;
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={mark} rounded={9} />
      <span className="flex flex-col leading-none">
        <span
          className="text-[10px] font-bold text-soft tracking-wide"
          style={{ marginBottom: 2 }}
        >
          私の
        </span>
        <span
          className={`font-black text-ink ${
            size === "sm" ? "text-[14px]" : "text-[16px]"
          }`}
        >
          おうちカルテ
        </span>
      </span>
    </span>
  );
}
