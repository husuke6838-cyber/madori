/**
 * 間取りエディタのデータモデル・寸法計算ヘルパ。
 *
 * 単位:
 * - グリッドセル = 半間 = 910mm（仕様§7.2）
 * - 1坪 = 2帖 ≈ 3.31㎡
 * - 帖 = 床面積㎡ ÷ 1.62（中京間基準）
 */

export const DEFAULT_GRID_MM = 910;

export type RoomShape = {
  id: string;
  x: number; // セル座標
  y: number;
  w: number; // セル単位の幅
  h: number; // セル単位の高さ
  label: string;
  type?: string; // 'LDK' | '主寝室' | 'トイレ' 等（任意）
};

export type DoorShape = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: 0 | 90 | 180 | 270;
  kind: "hinged" | "sliding" | "folding";
  swing?: "left" | "right";
  open?: "in" | "out";
};

export type WindowShape = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: 0 | 90 | 180 | 270;
};

export type FixtureShape = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: 0 | 90 | 180 | 270;
  kind:
    | "kitchen-i"
    | "kitchen-l"
    | "kitchen-island"
    | "bath"
    | "washbasin"
    | "toilet"
    | "stairs"
    | "closet"
    | "entrance";
  flip?: boolean;
};

export type TextShape = {
  id: string;
  x: number;
  y: number;
  content: string;
};

export type FloorplanData = {
  version: 1;
  rooms: RoomShape[];
  doors: DoorShape[];
  windows: WindowShape[];
  fixtures: FixtureShape[];
  texts: TextShape[];
};

export const EMPTY_FLOORPLAN: FloorplanData = {
  version: 1,
  rooms: [],
  doors: [],
  windows: [],
  fixtures: [],
  texts: [],
};

/**
 * セル幅×セル高 → 帖数（小数1桁）
 */
export function cellsToJou(w: number, h: number, gridMm = DEFAULT_GRID_MM) {
  const m2 = ((w * gridMm) / 1000) * ((h * gridMm) / 1000);
  return Math.round((m2 / 1.62) * 10) / 10;
}

/**
 * 概算サマリー（仕様§7.6）。
 * 居室合計帖 → 坪 → 延床 → 建築費レンジ → 固定資産税の目安。
 *
 * いずれも「初回会話のきっかけ用」の超概算で、断定ではない。
 */
export function summarizeFloorplan(rooms: RoomShape[]) {
  const totalJou = rooms.reduce(
    (s, r) => s + cellsToJou(r.w, r.h),
    0
  );
  const livingTsubo = totalJou / 2;
  // 廊下・水回り係数（中央値）
  const totalFloorTsubo = Math.round(livingTsubo * 1.3 * 10) / 10;

  // 坪単価 70〜90 万円で試算（一般グレード）
  const buildCostLow = Math.round((totalFloorTsubo * 70) / 10) * 10;
  const buildCostHigh = Math.round((totalFloorTsubo * 90) / 10) * 10;

  // 固定資産税 初年度の目安（粗い目安）
  // 木造新築の建物評価額 ≒ 坪20万円程度、税率1.4%、新築減額1/2 を加味
  const taxYearLow = Math.max(
    0,
    Math.round((totalFloorTsubo * 20 * 0.014 * 0.5) / 1) - 1
  );
  const taxYearHigh = Math.round((totalFloorTsubo * 25 * 0.014 * 0.5) / 1) + 1;

  return {
    totalJou: Math.round(totalJou * 10) / 10,
    livingTsubo: Math.round(livingTsubo * 10) / 10,
    totalFloorTsubo,
    buildCostLow,
    buildCostHigh,
    taxYearLow,
    taxYearHigh,
  };
}

/**
 * 部屋追加時のプリセット寸法（仕様§7.2 / §4）。
 *
 * 設計方針:
 * - 主要な部屋タイプには複数のサイズオプションを用意（広々／標準／コンパクト）
 * - ユーザーは「何帖が必要か」ではなく「どの広さ感か」で選べる
 * - 各サイズは 910mm グリッド単位なので、実寸 (Xm × Ym) を補助表示する
 * - 浴室は UB 規格を反映（1坪 = 1616 / 1.25坪 = 1620 を近似）
 */
export type RoomSize = {
  /** ラベル: "10帖" や "1坪" や "標準" など */
  name: string;
  w: number;
  h: number;
  /** 補足説明（任意） */
  note?: string;
};

export type RoomPreset = {
  /** 内部キー（type に保存） */
  key: string;
  label: string;
  emoji: string;
  /** モーダルの並びカテゴリ */
  category: "living" | "sleeping" | "water" | "entry" | "other";
  sizes: RoomSize[];
};

export const ROOM_PRESETS: RoomPreset[] = [
  {
    key: "LDK",
    label: "LDK",
    emoji: "🛋",
    category: "living",
    sizes: [
      { name: "コンパクト", w: 3, h: 6, note: "夫婦向け" },
      { name: "標準", w: 4, h: 6 },
      { name: "ゆったり", w: 5, h: 6 },
      { name: "広々", w: 6, h: 6, note: "4人家族＋" },
    ],
  },
  {
    key: "主寝室",
    label: "主寝室",
    emoji: "🛏",
    category: "sleeping",
    sizes: [
      { name: "6帖", w: 3, h: 3 },
      { name: "8帖", w: 3, h: 4, note: "標準" },
      { name: "10帖", w: 4, h: 4, note: "WIC付に最適" },
    ],
  },
  {
    key: "子供部屋",
    label: "子供部屋",
    emoji: "🧸",
    category: "sleeping",
    sizes: [
      { name: "4.5帖", w: 3, h: 2, note: "小学生まで" },
      { name: "6帖", w: 3, h: 3, note: "標準" },
      { name: "8帖", w: 3, h: 4 },
    ],
  },
  {
    key: "和室",
    label: "和室",
    emoji: "🟫",
    category: "sleeping",
    sizes: [
      { name: "4.5帖", w: 3, h: 2 },
      { name: "6帖", w: 3, h: 3, note: "標準" },
      { name: "8帖", w: 3, h: 4 },
    ],
  },
  {
    key: "書斎",
    label: "書斎",
    emoji: "📚",
    category: "other",
    sizes: [
      { name: "2帖", w: 2, h: 2, note: "PC机1つ" },
      { name: "4帖", w: 2, h: 3 },
    ],
  },
  {
    key: "WIC",
    label: "WIC",
    emoji: "👕",
    category: "sleeping",
    sizes: [
      { name: "2帖", w: 2, h: 2, note: "夫婦" },
      { name: "3帖", w: 2, h: 3 },
      { name: "4帖", w: 2, h: 4 },
    ],
  },
  {
    key: "浴室",
    label: "浴室",
    emoji: "🛁",
    category: "water",
    sizes: [
      { name: "0.75坪 (1216)", w: 2, h: 2, note: "コンパクト" },
      { name: "1坪 (1616)", w: 2, h: 2, note: "標準UB" },
      { name: "1.25坪 (1620)", w: 2, h: 3, note: "広々" },
    ],
  },
  {
    key: "洗面所",
    label: "洗面所",
    emoji: "🚿",
    category: "water",
    sizes: [
      { name: "1坪", w: 2, h: 2, note: "標準" },
      { name: "1.5坪", w: 2, h: 3, note: "脱衣広め" },
    ],
  },
  {
    key: "トイレ",
    label: "トイレ",
    emoji: "🚽",
    category: "water",
    sizes: [
      { name: "0.5坪", w: 1, h: 2, note: "標準" },
      { name: "0.75坪", w: 2, h: 2, note: "手洗い別" },
    ],
  },
  {
    key: "玄関",
    label: "玄関",
    emoji: "🚪",
    category: "entry",
    sizes: [
      { name: "1坪", w: 2, h: 2, note: "標準" },
      { name: "1.5坪", w: 2, h: 3, note: "シューズクローク併設" },
      { name: "2坪", w: 2, h: 4, note: "土間広め" },
    ],
  },
  {
    key: "ホール",
    label: "ホール",
    emoji: "↗",
    category: "entry",
    sizes: [
      { name: "1.5坪", w: 2, h: 3 },
      { name: "2坪", w: 2, h: 4 },
    ],
  },
  {
    key: "廊下",
    label: "廊下",
    emoji: "▭",
    category: "entry",
    sizes: [
      { name: "1間", w: 1, h: 2 },
      { name: "1.5間", w: 1, h: 3 },
      { name: "2間", w: 1, h: 4 },
    ],
  },
  {
    key: "納戸",
    label: "納戸",
    emoji: "📦",
    category: "other",
    sizes: [
      { name: "1坪", w: 2, h: 2 },
      { name: "1.5坪", w: 2, h: 3 },
      { name: "2坪", w: 2, h: 4 },
    ],
  },
  {
    key: "部屋",
    label: "その他の部屋",
    emoji: "▦",
    category: "other",
    sizes: [
      { name: "4.5帖", w: 3, h: 2 },
      { name: "6帖", w: 3, h: 3 },
      { name: "8帖", w: 3, h: 4 },
    ],
  },
];

export const ROOM_CATEGORY_LABEL: Record<RoomPreset["category"], string> = {
  living: "リビング・くつろぎ",
  sleeping: "寝室・個室・収納",
  water: "水まわり",
  entry: "玄関・通路",
  other: "その他",
};

/** key で検索（既存データに `type` で入っているキーから引く） */
export function findRoomPreset(key: string | undefined): RoomPreset | undefined {
  if (!key) return undefined;
  return ROOM_PRESETS.find((p) => p.key === key);
}

/** w×h のセル寸 → 実寸表記（メートル） */
export function cellsToMeters(w: number, h: number, gridMm = DEFAULT_GRID_MM) {
  const mw = ((w * gridMm) / 1000).toFixed(2).replace(/\.?0+$/, "");
  const mh = ((h * gridMm) / 1000).toFixed(2).replace(/\.?0+$/, "");
  return `${mw}m × ${mh}m`;
}

export const FLOORPLAN_MAX = 5;
