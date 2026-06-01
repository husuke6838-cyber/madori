export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-clay text-white grid place-items-center text-xl font-bold shadow-lg">
            家
          </div>
          <h1 className="font-mincho text-2xl">いえづくりノート</h1>
          <p className="text-xs text-ink-soft mt-1">
            家族で書きためる、家づくり計画ノート
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
