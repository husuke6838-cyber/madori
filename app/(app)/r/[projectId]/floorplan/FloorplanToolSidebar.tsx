"use client";

import { useState } from "react";
import { cn } from "@/lib/ui";

export type ToolItem = {
  icon: string;
  label: string;
  onClick: () => void;
};

export type ToolSection = {
  id: string;
  title: string;
  icon: string;
  tools: ToolItem[];
};

/**
 * 間取りエディタ用の縦アコーディオン サイドバー。
 *
 * - 常時キャンバスの右に表示（下までスクロールしなくても要素追加できる）
 * - 単一展開アコーディオン：他のセクションを開くと前のセクションは閉じる
 * - 既定で先頭セクションが開く
 */
export function FloorplanToolSidebar({
  sections,
}: {
  sections: ToolSection[];
}) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null);

  return (
    <aside
      className="w-[70px] flex-shrink-0 border-l border-line bg-surface-2/50 overflow-y-auto [scrollbar-width:none]"
    >
      {sections.map((section, idx) => {
        const open = openId === section.id;
        return (
          <div
            key={section.id}
            className={cn(
              idx < sections.length - 1 && "border-b border-line"
            )}
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : section.id)}
              aria-expanded={open}
              className={cn(
                "w-full flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold tap-44 transition-colors",
                open
                  ? "bg-clay-soft text-clay"
                  : "text-ink-soft active:bg-surface-2"
              )}
            >
              <span className="text-[16px] leading-none">{section.icon}</span>
              <span className="mt-1 leading-none">{section.title}</span>
              <span
                className={cn(
                  "text-[8px] mt-0.5 transition-transform",
                  open && "rotate-180"
                )}
              >
                ▼
              </span>
            </button>
            {open && (
              <div className="bg-surface py-1">
                {section.tools.map((tool, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={tool.onClick}
                    className="w-full flex flex-col items-center gap-0.5 py-2 px-1 text-[9.5px] text-ink-soft active:bg-clay-soft active:text-clay tap-44"
                  >
                    <span className="text-lg leading-none">{tool.icon}</span>
                    <span className="leading-tight text-center">
                      {tool.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}
