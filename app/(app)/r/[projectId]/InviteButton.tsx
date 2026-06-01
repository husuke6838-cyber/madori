"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  ensureInviteTokenAction,
  revokeInviteAction,
} from "./invite-actions";

export function InviteButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const url = token ? `${baseUrl}/join/${token}` : null;

  const handleOpen = () => {
    setOpen(true);
    if (!token) {
      // 既存リンク取得 or 新規発行（ensure はどちらも処理する）
      startTransition(async () => {
        const t = await ensureInviteTokenAction(projectId);
        setToken(t);
      });
    }
  };

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("URLをコピーしてください", url);
    }
  };

  const handleRevoke = () => {
    if (
      !confirm(
        "招待リンクを失効させます。\n以降は新しいリンクを発行する必要があります。よろしいですか？"
      )
    )
      return;
    const fd = new FormData();
    fd.set("projectId", projectId);
    startTransition(async () => {
      await revokeInviteAction(fd);
      setToken(null);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="border border-dashed border-clay text-clay text-[11.5px] font-bold px-2.5 py-1.5 rounded-full tap-44"
      >
        ✉ 家族を招待
      </button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="家族をこのルームに招待"
      >
        {!url ? (
          <p className="text-sm text-ink-soft">招待リンクを準備中…</p>
        ) : (
          <>
            <div className="bg-surface-2 border border-line rounded-lg px-3 py-2 text-[12px] text-ink-soft break-all">
              {url}
            </div>
            <p className="text-[11px] text-ink-faint mt-1.5 leading-relaxed">
              このリンクを家族にLINE等で送ってください。
              <br />
              受け取った人が自分のアカウントで開くと、このルームに参加して
              <b className="text-ink">同じ内容を一緒に編集</b>できます。
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
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  "おうちカルテへの招待"
                )}&body=${encodeURIComponent(
                  `おうちカルテに参加してください。\n下のリンクから自分のアカウントで参加できます。\n\n${url}`
                )}`}
              >
                <Button type="button" size="md" className="w-full">
                  ✉️ メールで送る
                </Button>
              </a>
            </div>
            <button
              type="button"
              onClick={handleRevoke}
              disabled={pending}
              className="w-full mt-3 text-[11px] text-ink-faint hover:text-clay tap-44"
            >
              このリンクを失効させる
            </button>
          </>
        )}
      </Modal>
    </>
  );
}
