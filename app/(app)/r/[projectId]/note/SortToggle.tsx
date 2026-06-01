import Link from "next/link";
import { cn } from "@/lib/ui";

/**
 * 全部屋共通の並び順トグル。
 * - 入力順（既定） / ★合計が多い順
 * - URL は `?sort=stars` で表現。クリック時に該当部屋が開いた状態を維持するため
 *   `?open=<roomId>` も付ける。
 */
export function SortToggle({
  projectId,
  roomId,
  sortByStars,
}: {
  projectId: string;
  roomId: string;
  sortByStars: boolean;
}) {
  const params = new URLSearchParams();
  if (!sortByStars) params.set("sort", "stars");
  params.set("open", roomId);
  const href = `/r/${projectId}/note?${params.toString()}`;

  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "text-[10.5px] font-bold rounded-full px-2.5 py-1 border tap-44 inline-flex items-center",
        sortByStars
          ? "text-accent border-accent bg-accent-soft"
          : "text-soft border-line bg-bg"
      )}
    >
      ★順
    </Link>
  );
}
