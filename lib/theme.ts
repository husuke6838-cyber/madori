/**
 * テーマカラーの定義と判定ヘルパ。
 * - データソース：auth.users.user_metadata.theme
 * - SSR 反映：Cookie `__theme` を proxy で同期 → root layout で読む
 */

export type ThemeId =
  | "blue"
  | "natural"
  | "green"
  | "coral"
  | "purple"
  | "teal"
  | "mustard"
  | "navy"
  | "mono"
  | "dark";

export const THEMES: Array<{ id: ThemeId; label: string; sample: string }> = [
  { id: "blue", label: "ブルー", sample: "#2f5fb0" },
  { id: "natural", label: "ナチュラル", sample: "#bd5d3a" },
  { id: "green", label: "グリーン", sample: "#1f9d57" },
  { id: "coral", label: "コーラル", sample: "#e8654e" },
  { id: "purple", label: "パープル", sample: "#7c5cc4" },
  { id: "teal", label: "ティール", sample: "#11998e" },
  { id: "mustard", label: "マスタード", sample: "#c79a2e" },
  { id: "navy", label: "ネイビー", sample: "#1f3a6b" },
  { id: "mono", label: "モノクロ", sample: "#3a3a38" },
  { id: "dark", label: "ダーク", sample: "#ffae57" },
];

const ALL_IDS = new Set<string>(THEMES.map((t) => t.id));

export function isValidTheme(v: string | null | undefined): v is ThemeId {
  return typeof v === "string" && ALL_IDS.has(v);
}

export const THEME_COOKIE = "__theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1年
