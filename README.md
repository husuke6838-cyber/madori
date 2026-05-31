# いえづくりノート

家族で書きためて形にする、家づくり計画ノート Web アプリ。
要望・参考写真・★評価から「計画書」と「2D 間取り図」まで一気通貫で工務店に渡せる。

## 技術スタック

- Next.js 16 (App Router) / TypeScript
- Tailwind CSS v4 / shadcn/ui
- Supabase（Auth / Postgres / Storage / Realtime）
- react-konva（Phase 2 で導入）
- Vercel デプロイ + PWA

## 開発フェーズ

仕様§12 のフェーズ順に段階的に開発する。

- **Phase 1**：基盤 + ノート + 計画書（コア価値）  ← いまここ
- **Phase 2**：間取りエディタ
- **Phase 3**：家族シェア / 打ち合わせ記録 / 仕様メモ / 手書き

詳細は仕様書（プロンプト）と `_design/iezukuri-note-A-mobile.html` を参照。

## セットアップ

```bash
cp .env.example .env.local   # Supabase の URL/Key を埋める
npm install
npx supabase start            # ローカル Postgres 起動（要 Docker）
npx supabase db reset         # supabase/migrations を適用
npm run dev
```

ブラウザで http://localhost:3000 を開く。

## Supabase マイグレーション

- スキーマ定義: `supabase/migrations/0001_init.sql`
- 本番反映: `npx supabase db push`（事前に `supabase link --project-ref <id>`）

## ディレクトリ

```
app/                # Next.js App Router
  (auth)/           # 認証ページ
  (app)/            # 要ログインのページ
  share/[token]/    # 非ログイン閲覧
  api/              # Route Handlers（OGP 取得等）
lib/
  supabase/         # server / client / middleware / admin
  seeds.ts          # 部屋テンプレ・初期メンバー
  constants.ts      # 色・概算レンジ・免責文
supabase/migrations # SQL マイグレーション
_design/            # デザインモック（参照用）
```
