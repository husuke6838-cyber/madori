"use client";

import { useState, useTransition } from "react";
import { THEMES, type ThemeId } from "@/lib/theme";
import { setThemeAction } from "@/app/actions/theme";

/**
 * ⚙ ボタン + テーマ選択ボトムシート。
 *
 * - 5列グリッドで10色のテーマプレビュー
 * - クリック直後に <html data-theme> を即更新（楽観的）
 * - 並行して setThemeAction が user_metadata + Cookie を更新
 */
export function ThemePicker({
  currentTheme,
}: {
  currentTheme: ThemeId;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ThemeId>(currentTheme);
  const [, startTransition] = useTransition();

  const pick = (id: ThemeId) => {
    if (id === active) return;
    setActive(id);
    // 楽観的に html の data-theme を即書き換え（next render 待たない）
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", id);
    }
    startTransition(async () => {
      await setThemeAction(id);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="設定（テーマカラー）"
        className="text-soft hover:text-ink tap-44 px-2 py-1.5 text-[19px]"
      >
        ⚙
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md bg-surf rounded-t-3xl px-5 pt-5 pb-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="テーマカラー選択"
          >
            <h3 className="text-base font-extrabold text-ink mb-1">
              テーマカラー
            </h3>
            <p className="text-[11.5px] text-soft mb-4">
              好きな色を選べます（家族それぞれの端末で別々でもOK）
            </p>

            <div className="grid grid-cols-5 gap-y-3.5 gap-x-2.5">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pick(t.id)}
                  className="flex flex-col items-center gap-1.5 tap-44"
                  aria-pressed={active === t.id}
                >
                  <span
                    className={`w-10 h-10 rounded-full border-[3px] grid place-items-center transition-colors ${
                      active === t.id ? "border-ink" : "border-transparent"
                    }`}
                  >
                    <span
                      className="w-[30px] h-[30px] rounded-full block"
                      style={{ background: t.sample }}
                    />
                  </span>
                  <span className="text-[10px] font-bold text-soft text-center">
                    {t.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full mt-5 bg-accent text-white font-extrabold text-[14px] py-3 rounded-xl tap-44"
            >
              完了
            </button>
          </div>
        </div>
      )}
    </>
  );
}
