"use client";

import { useEffect } from "react";

/**
 * シンプルなフルスクリーン半透明オーバーレイ＋カードのモーダル。
 * Esc キーとオーバーレイクリックで閉じる。
 */
export function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink/40" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full sm:max-w-sm bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 m-0 sm:m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h3 className="font-mincho text-lg mb-2.5">{title}</h3>
        )}
        {children}
      </div>
    </div>
  );
}
