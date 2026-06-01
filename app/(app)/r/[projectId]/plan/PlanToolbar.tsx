"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  ensureShareLinkAction,
  revokeShareLinkAction,
} from "./actions";

export function PlanToolbar({
  projectId,
  projectName,
  initialShareUrl,
}: {
  projectId: string;
  projectName: string;
  initialShareUrl: string | null;
}) {
  const [shareUrl, setShareUrl] = useState(initialShareUrl);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const handleCreate = () => {
    startTransition(async () => {
      const token = await ensureShareLinkAction(projectId);
      setShareUrl(`${baseUrl}/share/${token}`);
    });
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // フォールバック：プロンプトで表示
      window.prompt("URLをコピーしてください", shareUrl);
    }
  };

  const handleRevoke = () => {
    if (!confirm("共有リンクを失効させます。よろしいですか？\n（再度発行は可能ですが、URLは変わります）"))
      return;
    const fd = new FormData();
    fd.set("projectId", projectId);
    startTransition(async () => {
      await revokeShareLinkAction(fd);
      setShareUrl(null);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const mailto = shareUrl
    ? `mailto:?subject=${encodeURIComponent(
        `家づくり計画書：${projectName}`
      )}&body=${encodeURIComponent(
        `${projectName} の家づくり計画書を共有します。\n下のリンクから内容をご覧ください。\n\n${shareUrl}\n\n※ 共有リンクをご存知の方なら誰でも閲覧できます。`
      )}`
    : null;

  return (
    <div className="px-5 pt-4 pb-3 print:hidden">
      <div className="bg-surface border border-line rounded-[var(--radius-card)] p-4 shadow-[0_5px_14px_rgba(60,45,30,0.05)]">
        <h3 className="text-[15px] font-bold mb-2">工務店に渡す</h3>

        {shareUrl ? (
          <>
            <div className="bg-surface-2 border border-line rounded-lg px-3 py-2 text-[12px] text-ink-soft break-all">
              {shareUrl}
            </div>
            <p className="text-[11px] text-ink-faint mt-1.5 leading-relaxed">
              このリンクを知っている人は誰でも閲覧できます（編集はできません）。
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="md"
                variant="outline"
                onClick={handleCopy}
              >
                {copied ? "✓ コピーしました" : "🔗 URLコピー"}
              </Button>
              {mailto && (
                <a href={mailto}>
                  <Button type="button" size="md" className="w-full">
                    ✉️ メールで送る
                  </Button>
                </a>
              )}
              <Button
                type="button"
                size="md"
                variant="outline"
                onClick={handlePrint}
              >
                🖨 プリント
              </Button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={pending}
                className="text-[11px] text-ink-faint hover:text-clay px-3 py-2 tap-44"
              >
                {pending ? "..." : "リンクを失効させる"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[12px] text-ink-soft leading-relaxed mb-3">
              共有リンクを発行すると、工務店や家族に
              <br />
              <span className="font-bold">アカウント登録なしで閲覧</span>
              してもらえます。
            </p>
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={handleCreate}
              disabled={pending}
            >
              {pending ? "発行中..." : "🔗 共有リンクを発行する"}
            </Button>
            <button
              type="button"
              onClick={handlePrint}
              className="w-full mt-2 text-[12px] text-ink-soft py-2 tap-44"
            >
              または このまま🖨プリント する
            </button>
          </>
        )}
      </div>
    </div>
  );
}
