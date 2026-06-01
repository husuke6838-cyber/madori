"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import {
  addItemImageAction,
  addItemLinkAction,
  deleteItemImageAction,
  deleteItemLinkAction,
} from "./actions";

type ImageEntry = { id: string; signedUrl: string | null };
type LinkEntry = {
  id: string;
  url: string;
  og_title: string | null;
  og_image: string | null;
  og_desc: string | null;
};

export function ItemAttachments({
  itemId,
  images,
  links,
}: {
  itemId: string;
  images: ImageEntry[];
  links: LinkEntry[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const removeImage = (imageId: string) => {
    if (!confirm("この写真を削除しますか？")) return;
    const fd = new FormData();
    fd.set("imageId", imageId);
    startTransition(async () => {
      await deleteItemImageAction(fd);
    });
  };

  const removeLink = (linkId: string) => {
    if (!confirm("この参考リンクを削除しますか？")) return;
    const fd = new FormData();
    fd.set("linkId", linkId);
    startTransition(async () => {
      await deleteItemLinkAction(fd);
    });
  };

  const hasAny = images.length > 0 || links.length > 0;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) =>
            img.signedUrl ? (
              <button
                key={img.id}
                type="button"
                onClick={() => removeImage(img.id)}
                disabled={pending}
                className="relative w-[74px] h-[74px] rounded-[10px] overflow-hidden border border-line group"
                aria-label="写真を削除"
              >
                <Image
                  src={img.signedUrl}
                  alt="参考写真"
                  fill
                  sizes="74px"
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute top-0 right-0 bg-ink/60 text-white text-[10px] px-1.5 py-0.5 rounded-bl">
                  ×
                </span>
              </button>
            ) : (
              <div
                key={img.id}
                className="w-[74px] h-[74px] rounded-[10px] border border-line bg-surface-2 grid place-items-center text-[10px] text-ink-faint"
              >
                取得失敗
              </div>
            )
          )}
        </div>
      )}

      {links.map((l) => (
        <div
          key={l.id}
          className="flex border border-line rounded-[11px] overflow-hidden bg-surface-2"
        >
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 min-w-0 active:bg-surface"
          >
            <div className="w-14 flex-shrink-0 bg-gradient-to-br from-[#e7d9c4] to-[#d8c4a6] grid place-items-center text-[17px] overflow-hidden">
              {l.og_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.og_image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                "🔗"
              )}
            </div>
            <div className="px-2.5 py-2 flex-1 min-w-0">
              <div className="text-[12px] font-bold leading-tight line-clamp-2">
                {l.og_title || l.url}
              </div>
              <div className="text-[10.5px] text-ink-faint mt-0.5 truncate">
                {hostnameOf(l.url)}
              </div>
            </div>
          </a>
          <button
            type="button"
            onClick={() => removeLink(l.id)}
            disabled={pending}
            className="px-3 text-ink-faint hover:text-clay text-sm tap-44"
            aria-label="リンクを削除"
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start border border-dashed border-[#d4c9b6] bg-transparent text-ink-soft text-[12px] font-bold px-3 py-1.5 rounded-[18px] tap-44"
      >
        ＋ 参考リンク・写真{hasAny ? "を追加" : ""}
      </button>

      <AddAttachmentModal
        itemId={itemId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

function AddAttachmentModal({
  itemId,
  open,
  onClose,
}: {
  itemId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"image" | "link">("image");
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setUrl("");
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("itemId", itemId);
    fd.set("file", file);
    startTransition(async () => {
      try {
        await addItemImageAction(fd);
        reset();
        onClose();
      } catch (e) {
        setError(String((e as Error).message || e));
      }
    });
  };

  const handleAddLink = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      try {
        // 先に OGP を取得（失敗してもプレーンリンクで登録）
        let meta: {
          title?: string | null;
          image?: string | null;
          description?: string | null;
        } = {};
        try {
          const res = await fetch(
            `/api/og?url=${encodeURIComponent(trimmed)}`
          );
          if (res.ok) meta = await res.json();
        } catch {}

        const fd = new FormData();
        fd.set("itemId", itemId);
        fd.set("url", trimmed);
        if (meta.title) fd.set("og_title", meta.title);
        if (meta.image) fd.set("og_image", meta.image);
        if (meta.description) fd.set("og_desc", meta.description);
        await addItemLinkAction(fd);
        reset();
        onClose();
      } catch (e) {
        setError(String((e as Error).message || e));
      }
    });
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!pending) {
          reset();
          onClose();
        }
      }}
      title="参考リンク・写真を追加"
    >
      <div className="flex gap-1 mb-3 bg-surface-2 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setTab("image")}
          className={`flex-1 text-xs font-bold py-2 rounded-md ${
            tab === "image" ? "bg-surface text-ink shadow-sm" : "text-ink-soft"
          }`}
        >
          📷 写真
        </button>
        <button
          type="button"
          onClick={() => setTab("link")}
          className={`flex-1 text-xs font-bold py-2 rounded-md ${
            tab === "link" ? "bg-surface text-ink shadow-sm" : "text-ink-soft"
          }`}
        >
          🔗 リンク
        </button>
      </div>

      {error && (
        <p className="mb-3 text-xs bg-clay-soft text-[#8a3d20] border border-[#ecc7b3] rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {tab === "image" ? (
        <div className="space-y-3">
          <p className="text-xs text-ink-soft leading-relaxed">
            インスタやメーカーサイトのスクショ・写真を選んでください。
            <br />
            <span className="text-ink-faint">5MB まで</span>
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="block w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-clay file:text-white file:font-bold"
          />
          <div className="flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                if (!pending) {
                  reset();
                  onClose();
                }
              }}
              disabled={pending}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1"
              onClick={handleUpload}
              disabled={pending}
            >
              {pending ? "アップロード中..." : "追加"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label htmlFor="og-url">URL</Label>
            <Input
              id="og-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/... など"
              autoFocus
            />
            <p className="text-[11px] text-ink-faint mt-1.5 leading-relaxed">
              インスタの投稿・施工事例ページ・メーカーカタログなど。
              <br />
              タイトル・画像は自動で取得されます（失敗時はプレーンリンクで登録）
            </p>
          </div>
          <div className="flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                if (!pending) {
                  reset();
                  onClose();
                }
              }}
              disabled={pending}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1"
              onClick={handleAddLink}
              disabled={pending || !url.trim()}
            >
              {pending ? "取得中..." : "追加"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
