import Link from "next/link";
import { cn } from "@/lib/ui";

type Room = {
  id: string;
  name: string;
  no_request: boolean;
};

export function RoomTabs({
  rooms,
  currentRoomId,
  projectId,
  itemCounts,
}: {
  rooms: Room[];
  currentRoomId: string | null;
  projectId: string;
  itemCounts: Record<string, number>;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 [&::-webkit-scrollbar]:h-0 [scrollbar-width:none]">
      {rooms.map((r) => {
        const active = r.id === currentRoomId;
        const has = (itemCounts[r.id] ?? 0) > 0 || r.no_request;
        return (
          <Link
            key={r.id}
            href={`/r/${projectId}/note?room=${r.id}`}
            className={cn(
              "flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[20px] text-[13px] whitespace-nowrap border tap-44",
              active
                ? "bg-surface text-ink font-bold border-line shadow-[0_4px_11px_rgba(60,45,30,0.07)]"
                : "bg-surface-2 text-ink-soft border-line"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                has ? "bg-sage" : "bg-line"
              )}
            />
            {r.name}
          </Link>
        );
      })}
    </div>
  );
}
