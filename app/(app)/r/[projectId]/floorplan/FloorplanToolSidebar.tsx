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
 * - 開閉可能：閉じてる時は細い縦タブだけになり、方眼を最大化できる
 * - 単一展開アコーディオン：他のセクションを開くと前のセクションは閉じる
 * - 既定で先頭セクションが開く
 * - topContent: 「⛶ 全体」ボタン／選択中アクションをサイドバー先頭に固定表示
 */
export function FloorplanToolSidebar({
  sections,
  topContent,
  open,
  onToggle,
}: {
  sections: ToolSection[];
  topContent?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null);

  // 閉じてる：細いタブだけ
  if (!open) {
    return (
      <aside
        className="w-7 flex-shrink-0 border-l border-line bg-surface-2/40 flex justify-center pt-1.5"
        style={{ maxHeight: "min(60vh, 560px)" }}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label="ツールを開く"
          className="w-6 py-3 rounded-md bg-surface border border-line text-soft hover:text-ink active:bg-bg text-[10px] font-bold tap-44 flex flex-col items-center gap-1"
        >
          <span aria-hidden="true">◀</span>
          <span
            className="leading-tight"
            style={{ writingMode: "vertical-rl", textOrientation: "upright" }}
          >
            ツール
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="w-[78px] flex-shrink-0 border-l border-line bg-surface-2/50 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:w-0"
      style={{ maxHeight: "min(60vh, 560px)" }}
    >
      {/* 閉じるトグル */}
      <button
        type="button"
        onClick={onToggle}
        aria-label="ツールを閉じる"
        className="w-full flex items-center justify-center gap-1 py-1.5 text-[9.5px] font-bold text-soft border-b border-line bg-surf/60 hover:text-ink tap-44"
      >
        <span aria-hidden="true">▶</span> 閉じる
      </button>

      {topContent}
      {sections.map((section, idx) => {
        const sopen = openId === section.id;
        return (
          <div
            key={section.id}
            className={cn(
              idx < sections.length - 1 && "border-b border-line"
            )}
          >
            <button
              type="button"
              onClick={() => setOpenId(sopen ? null : section.id)}
              aria-expanded={sopen}
              className={cn(
                "w-full flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold tap-44 transition-colors",
                sopen
                  ? "bg-clay-soft text-clay"
                  : "text-ink-soft active:bg-surface-2"
              )}
            >
              <span className="text-[16px] leading-none">{section.icon}</span>
              <span className="mt-1 leading-none">{section.title}</span>
              <span
                className={cn(
                  "text-[8px] mt-0.5 transition-transform",
                  sopen && "rotate-180"
                )}
              >
                ▼
              </span>
            </button>
            {sopen && (
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
