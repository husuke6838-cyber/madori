import { LogoMark } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <LogoMark size={56} rounded={14} />
          </div>
          <h1 className="text-2xl font-extrabold">私のおうちカルテ</h1>
          <p className="text-xs text-soft mt-1">
            家族で書きためる、家づくり計画ノート
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
