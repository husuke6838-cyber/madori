/**
 * プロジェクト（=ルーム）作成時のシードデータ。
 * UIから「新しいルームを作る」→ サーバアクションで以下を挿入する。
 *
 * 家族メンバー: 仕様§10「奥さん(ピンク)/旦那さん(青)」を既定。
 * 部屋テンプレ: 仕様§10。
 * 後悔ポイント・検討ヒント: 仕様§11。
 */

export const FAMILY_PALETTE = [
  { name: "奥さん", color: "#c6587f", soft: "#f6e3ea" },
  { name: "旦那さん", color: "#4f7a99", soft: "#e0ebf1" },
  // 追加時はここから順に割り当て
  { name: "お子さん", color: "#a67c3a", soft: "#f1e5d2" },
  { name: "おじいちゃん", color: "#6f7d5c", soft: "#e8ecdf" },
  { name: "おばあちゃん", color: "#8b6db1", soft: "#ebe2f3" },
] as const;

export const DEFAULT_MEMBERS = [
  { name: "奥さん", color: "#c6587f" },
  { name: "旦那さん", color: "#4f7a99" },
] as const;

export type RoomTemplate = {
  name: string;
  subtitle?: string;
  kind: "place" | "overall";
  desired_jou?: number | null;
  hints: string[]; // 検討ヒント（タップで要望追加）
  regrets: string[]; // 💡 後悔ポイント
};

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    name: "全体",
    subtitle: "家全体に関わること",
    kind: "overall",
    desired_jou: null,
    hints: [
      "予算配分",
      "断熱性能（UA値・気密）",
      "動線（家事・帰宅・来客）",
      "収納量",
      "電気配線・コンセント位置",
      "耐震等級",
    ],
    regrets: [
      "コンセントは『多すぎ？』くらいで丁度いい。後付けは割高",
      "家事動線（洗濯→干す→しまう）を一直線に",
      "収納率は延床の12〜15%が目安。多すぎても居住面積を圧迫する",
    ],
  },
  {
    name: "玄関",
    kind: "place",
    desired_jou: 2,
    hints: [
      "向き（方位）",
      "間口（cm）",
      "土間収納",
      "シューズクローク",
      "採光（窓）",
      "コンセント",
    ],
    regrets: [
      "玄関のコンセントは掃除機・電動自転車の充電に便利。忘れがち",
      "シューズクロークは『通り抜けできるか』で使い勝手が大きく変わる",
    ],
  },
  {
    name: "LDK",
    subtitle: "リビング・ダイニング・キッチン",
    kind: "place",
    desired_jou: 18,
    hints: [
      "広さ（畳）",
      "キッチン形状（I型/L型/アイランド）",
      "床材",
      "吹き抜け",
      "床暖房",
      "収納",
    ],
    regrets: [
      "キッチンのコンセントは2ヶ所以上あると、後で家電が増えても困りにくい",
      "吹き抜けは開放的だが冷暖房効率と音の回りに注意",
      "南に大きな窓＝正解とは限らない。夏の日射と道路からの視線も考える",
    ],
  },
  {
    name: "主寝室",
    kind: "place",
    desired_jou: 7,
    hints: ["広さ", "WIC", "コンセント", "窓の向き"],
    regrets: [
      "ベッド両側に枕元コンセントがあると後悔しない",
      "西窓は夏の西日が強い。遮熱・庇を検討",
    ],
  },
  {
    name: "子供部屋",
    kind: "place",
    desired_jou: 5,
    hints: ["部屋数", "広さ", "収納", "将来仕切れるか"],
    regrets: [
      "将来仕切れる設計（ドア2つ・窓2つ）にしておくと家族構成変化に強い",
    ],
  },
  {
    name: "浴室",
    kind: "place",
    desired_jou: 2,
    hints: ["サイズ（0.75/1/1.25坪）", "窓", "浴室乾燥", "追い焚き"],
    regrets: [
      "窓を付けない方が夏に熱がこもりにくく掃除も楽、という選択肢もある",
    ],
  },
  {
    name: "洗面所",
    kind: "place",
    desired_jou: 2,
    hints: ["広さ", "二人並べるか", "収納", "タオル掛け"],
    regrets: [
      "朝の混雑が気になるなら洗面ボウル2つ or 幅広（120cm〜）を検討",
    ],
  },
  {
    name: "トイレ",
    kind: "place",
    desired_jou: 1,
    hints: ["数", "手洗い", "収納", "タンクレス"],
    regrets: [
      "窓を付けない方が夏に熱がこもりにくく掃除も楽、という選択肢もある",
      "2階トイレは1階の真上に配置すると配管が短くコスト・音で有利",
    ],
  },
  {
    name: "収納・WIC",
    kind: "place",
    desired_jou: 3,
    hints: ["ファミクロ", "パントリー", "各部屋クローゼット"],
    regrets: [
      "ファミリークローゼットは『脱衣室から続く』動線にすると洗濯が楽",
    ],
  },
  {
    name: "外構・庭",
    kind: "place",
    desired_jou: null,
    hints: ["駐車台数", "ウッドデッキ", "物置", "庭の使い方"],
    regrets: [
      "外構は予算を後回しにしがちだが、家の印象は8割が外構で決まる",
      "駐車場は『来客分＋将来の車数』も見越して計画する",
    ],
  },
];
