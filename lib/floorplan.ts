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
 * 部屋追加時の既定サイズ（セル）。
 * 仕様§7.2 のサジェスト目安を 910mm グリッドに当てはめたもの。
 */
export const ROOM_TYPE_PRESETS: Record<
  string,
  { label: string; w: number; h: number }
> = {
  LDK: { label: "LDK", w: 5, h: 6 }, // ≒ 17帖
  主寝室: { label: "主寝室", w: 3, h: 4 }, // ≒ 6.7帖
  子供部屋: { label: "子供部屋", w: 3, h: 3 }, // ≒ 5帖
  和室: { label: "和室", w: 3, h: 3 },
  WIC: { label: "WIC", w: 2, h: 2 },
  浴室: { label: "浴室", w: 2, h: 2 }, // 1坪サイズ
  洗面所: { label: "洗面所", w: 2, h: 2 },
  トイレ: { label: "トイレ", w: 1, h: 2 },
  玄関: { label: "玄関", w: 2, h: 2 },
  ホール: { label: "ホール", w: 2, h: 3 },
  廊下: { label: "廊下", w: 1, h: 3 },
  納戸: { label: "納戸", w: 2, h: 2 },
  書斎: { label: "書斎", w: 2, h: 2 },
  部屋: { label: "部屋", w: 3, h: 3 },
};

export const FLOORPLAN_MAX = 5;
