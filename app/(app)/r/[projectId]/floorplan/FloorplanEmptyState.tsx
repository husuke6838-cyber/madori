import { Button } from "@/components/ui/Button";
import { createFloorplanAction } from "./actions";

export function FloorplanEmptyState({
  projectId,
  error,
}: {
  projectId: string;
  error?: string;
}) {
  return (
    <main className="px-5 py-6">
      <div className="text-2xl font-bold mb-1">間取り</div>
      <p className="text-xs text-ink-soft mb-6 leading-relaxed">
        マス目に部屋を置いて、理想の間取りを2Dで描く。
        <br />
        家族で見ながら微調整できます。
      </p>

      {error && (
        <p className="mb-4 text-xs bg-clay-soft text-[#8a3d20] border border-[#ecc7b3] rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

      <form action={createFloorplanAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="name" value="1階" />
        <Button type="submit" size="lg" className="w-full">
          ＋ 最初の間取りを作る（1階）
        </Button>
      </form>

      <p className="text-[11px] text-ink-faint mt-3 leading-relaxed">
        ※ 1ルームあたり最大5個まで作成できます（1階・2階・案A/B など）
      </p>
    </main>
  );
}
