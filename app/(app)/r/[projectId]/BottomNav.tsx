"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui";

const tabs = [
  { key: "note", label: "ノート", icon: "✎" },
  { key: "plan", label: "計画書", icon: "📄" },
  { key: "floorplan", label: "間取り", icon: "▦" },
  { key: "log", label: "記録", icon: "🗒" },
] as const;

export function BottomNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
      <div className="max-w-md mx-auto grid grid-cols-4">
        {tabs.map((t) => {
          const href = `/r/${projectId}/${t.key}`;
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={t.key}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2.5 pb-4 text-[10px] font-bold tap-44 transition-colors",
                active ? "text-clay" : "text-ink-faint"
              )}
            >
              <span className="text-[17px] leading-none">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
