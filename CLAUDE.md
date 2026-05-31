@AGENTS.md

# プロジェクト固有のメモ

## 開発スタンス
- 仕様§12 のフェーズ順に段階的に開発。一度に全機能を実装しない。
- 各フェーズ完了ごとに動作確認できる状態にする。
- 費用・税金・法規ヒントは必ず「概算・目安」とし、断定や助言にならない文言を添える（仕様§9.4）。
- スマホ実機での操作性を最優先（タップ領域 44px 以上、親指リーチ）。

## 用語ルール（混同厳禁）
- UI 上の「ルーム」 = DB の **`projects`**（家づくり共有ワークスペース、1家づくり）
- 家の中の「部屋／場所」 = DB の **`rooms`**（玄関・LDK 等）
- コード／URL／i18n キーでも `project` と `room` を厳密に使い分ける

## デザイン
- モック: `_design/iezukuri-note-A-mobile.html` を見た目・インタラクションの正とする
- 色トークンは `app/globals.css` の CSS 変数で定義し、Tailwind v4 の `@theme` 経由で利用
- フォント: 見出し・部屋名 = Shippori Mincho、本文・UI = Zen Kaku Gothic New

## Next.js のバージョンについて
仕様書では Next.js 15 が指定されているが、`create-next-app@latest` で 16 が入った。
App Router API は互換のため 16 のまま進める。バグや互換性問題が出たら 15 にダウングレード検討。

## Supabase
- ローカル開発は `npx supabase start` / `npx supabase db reset`
- 本番反映は `npx supabase db push`
- service_role キーは絶対にクライアントへ露出しない（`lib/supabase/admin.ts` で server-only）

## Phase 1 完了の定義（受け入れ基準・抜粋）
- スマホ実機で全タブ（4タブのうち実装済みのもの）が快適に操作可
- 誰でもサインアップ可、自分のルームを作成・複数所有可
- 招待リンクで別アカウントを同じルームに参加させ、双方が同じ内容を編集できる
- 共有リンクを非ログインのブラウザで開いて計画書が見える
- 概算・税の表示に免責文言が必ず添えられている
