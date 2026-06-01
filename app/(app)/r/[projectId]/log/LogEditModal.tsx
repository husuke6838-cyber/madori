"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export type LogForm = {
  logDate: string;
  title: string;
  saidUs: string;
  saidThem: string;
  status: "done" | "planned";
};

export function LogEditModal({
  open,
  initial,
  title,
  submitLabel,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial: LogForm | null;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (form: LogForm) => void;
}) {
  const [form, setForm] = useState<LogForm>({
    logDate: todayIso(),
    title: "",
    saidUs: "",
    saidThem: "",
    status: "done",
  });

  useEffect(() => {
    if (open && initial) setForm(initial);
    else if (open) {
      setForm({
        logDate: todayIso(),
        title: "",
        saidUs: "",
        saidThem: "",
        status: "done",
      });
    }
  }, [open, initial]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="log-date">日付</Label>
            <Input
              id="log-date"
              type="date"
              value={form.logDate}
              onChange={(e) => setForm({ ...form, logDate: e.target.value })}
              required
            />
          </div>
          <div className="w-32">
            <Label htmlFor="log-status">状態</Label>
            <select
              id="log-status"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as "done" | "planned",
                })
              }
              className="w-full px-2 py-3 text-[15px] bg-surface text-ink rounded-[var(--radius-btn)] border border-line focus:outline-none focus:border-clay tap-44"
            >
              <option value="done">完了</option>
              <option value="planned">予定</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="log-title">タイトル</Label>
          <Input
            id="log-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="例: 初回相談（○○工務店・田中さん）"
            maxLength={120}
            required
          />
        </div>

        <div>
          <Label htmlFor="log-us">伝えたこと</Label>
          <textarea
            id="log-us"
            value={form.saidUs}
            onChange={(e) => setForm({ ...form, saidUs: e.target.value })}
            rows={2}
            placeholder="（任意）こちらから伝えた要望・質問"
            className="w-full px-3 py-2.5 text-[13.5px] bg-surface text-ink rounded-[var(--radius-btn)] border border-line focus:outline-none focus:border-clay focus:ring-2 focus:ring-clay-soft resize-none"
          />
        </div>

        <div>
          <Label htmlFor="log-them">担当の方の回答</Label>
          <textarea
            id="log-them"
            value={form.saidThem}
            onChange={(e) => setForm({ ...form, saidThem: e.target.value })}
            rows={2}
            placeholder="（任意）相手の説明・宿題・次回の予定"
            className="w-full px-3 py-2.5 text-[13.5px] bg-surface text-ink rounded-[var(--radius-btn)] border border-line focus:outline-none focus:border-clay focus:ring-2 focus:ring-clay-soft resize-none"
          />
        </div>

        <div className="flex gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onClose}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1"
            onClick={() => onSubmit(form)}
            disabled={!form.title.trim() || !form.logDate}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}
