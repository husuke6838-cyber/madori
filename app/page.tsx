/**
 * ルートのランディング。
 * Phase 1 ③（認証＋ルーム一覧）で本実装に置き換える。
 * 現状は環境構築の動作確認用。
 */
export default function Landing() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-clay text-white grid place-items-center text-2xl font-bold shadow-lg">
          家
        </div>
        <h1 className="font-mincho text-3xl mb-3">いえづくりノート</h1>
        <p className="text-sm text-ink-soft leading-relaxed">
          家族で書きためて形にする、家づくり計画ノート。
          <br />
          現在 Phase&nbsp;1 構築中。
        </p>
      </div>
    </main>
  );
}
