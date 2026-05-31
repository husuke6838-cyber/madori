/**
 * UI共通の定数。
 * 色トークンは globals.css の CSS 変数と一致させる。
 */

export const COLORS = {
  paper: "#f4efe7",
  surface: "#fffdf9",
  surface2: "#faf6ee",
  ink: "#2c2722",
  inkSoft: "#6b635a",
  inkFaint: "#a39a8d",
  line: "#e6ddcf",
  clay: "#bd5d3a",
  claySoft: "#f3e2d9",
  sage: "#6f7d5c",
  sageSoft: "#e8ecdf",
  wallStroke: "#9c907c",
} as const;

// 概算費用レンジ（仕様§7.6 / 万円・坪単価）
export const COST_RANGES = {
  lowcost: { label: "ローコスト", min: 50, max: 60 },
  standard: { label: "一般", min: 70, max: 90 },
  premium: { label: "こだわり", min: 100, max: 150 },
} as const;

// 1坪 = 約3.31㎡ = 2帖（中京間）
export const TSUBO_TO_SQM = 3.31;
export const JOU_TO_SQM = 1.62;

// 延床係数（廊下・階段・水回り）
export const FLOOR_AREA_COEFFICIENT = { min: 1.25, max: 1.35 } as const;

// 計画書・概算サマリの共通免責文言（§9.4）
export const DISCLAIMER_COST =
  "この金額はマス目から自動算出した超概算の目安です。実際は仕様・地域・住宅会社・軽減措置により大きく変わります。正確な金額は工務店・自治体・専門家にご確認ください。";

export const DISCLAIMER_PLAN =
  "間取り・寸法・法規ヒントは検討用の参考です。実施設計・確認申請・構造計算・法適合判定は建築士・工務店が正式に行います。";

// マネタイズ枠（後で実リンク差し込み）
export const PARTNER_LINKS: Array<{ label: string; url: string }> = [
  // { label: "タウンライフ家づくり（無料一括資料請求）", url: "" },
  // { label: "LIFULL HOME'S（注文住宅）", url: "" },
  // { label: "SUUMO（注文住宅）", url: "" },
];
