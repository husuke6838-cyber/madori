export default function FloorplanTab() {
  return (
    <main className="px-5 py-5">
      <div className="font-mincho text-2xl mb-1">間取り</div>
      <p className="text-xs text-ink-soft mb-6">
        マス目に部屋を置いて、理想の間取りを2Dで描く
      </p>
      <div className="text-center text-xs text-ink-faint border border-dashed border-line bg-surface-2 rounded-[var(--radius-card)] px-5 py-8">
        Phase 2 で実装（react-konva）
      </div>
    </main>
  );
}
