import Link from "next/link";
import { cn } from "@/lib/ui";

export function SortToggle({
  projectId,
  roomId,
  sortByStars,
}: {
  projectId: string;
  roomId: string;
  sortByStars: boolean;
}) {
  const href = sortByStars
    ? `/r/${projectId}/note?room=${roomId}`
    : `/r/${projectId}/note?room=${roomId}&sort=stars`;

  return (
    <Link
      href={href}
      className={cn(
        "text-[11px] font-bold rounded-[14px] px-3 py-1.5 border tap-44",
        sortByStars
          ? "text-clay border-clay bg-clay-soft"
          : "text-ink-soft border-line bg-surface-2"
      )}
    >
      ★順
    </Link>
  );
}
