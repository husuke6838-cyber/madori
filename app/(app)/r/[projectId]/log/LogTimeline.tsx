"use client";

import { useOptimistic, useState, useTransition } from "react";
import { cn } from "@/lib/ui";
import { LogEditModal, type LogForm } from "./LogEditModal";
import {
  deleteMeetingLogAction,
  toggleMeetingLogStatusAction,
  updateMeetingLogAction,
} from "./actions";

export type LogItem = {
  id: string;
  logDate: string;
  title: string;
  saidUs: string;
  saidThem: string;
  status: "done" | "planned";
};

type OptimisticChange =
  | { kind: "toggle"; id: string }
  | { kind: "delete"; id: string };

export function LogTimeline({
  projectId,
  logs,
}: {
  projectId: string;
  logs: LogItem[];
}) {
  const [editing, setEditing] = useState<LogItem | null>(null);
  const [, startTransition] = useTransition();

  // 楽観的更新：ステータス切替と削除を即時反映
  const [optimisticLogs, applyOptimistic] = useOptimistic(
    logs,
    (state: LogItem[], change: OptimisticChange) => {
      if (change.kind === "toggle") {
        return state.map((l) =>
          l.id === change.id
            ? { ...l, status: l.status === "done" ? "planned" : "done" }
            : l
        );
      }
      return state.filter((l) => l.id !== change.id);
    }
  );

  const toggleStatus = (id: string) => {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      applyOptimistic({ kind: "toggle", id });
      await toggleMeetingLogStatusAction(fd);
    });
  };

  const handleSave = (form: LogForm) => {
    if (!editing) return;
    const fd = new FormData();
    fd.set("id", editing.id);
    fd.set("projectId", projectId);
    fd.set("log_date", form.logDate);
    fd.set("title", form.title);
    fd.set("said_us", form.saidUs);
    fd.set("said_them", form.saidThem);
    fd.set("status", form.status);
    startTransition(async () => {
      await updateMeetingLogAction(fd);
      setEditing(null);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("この記録を削除しますか？")) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      applyOptimistic({ kind: "delete", id });
      await deleteMeetingLogAction(fd);
      setEditing(null);
    });
  };

  return (
    <>
      <div>
        {optimisticLogs.map((log, idx) => (
          <div
            key={log.id}
            className={cn(
              "relative pl-7 ml-1.5",
              idx < optimisticLogs.length - 1
                ? "pb-5 border-l-2 border-line"
                : "pb-2"
            )}
          >
            <button
              type="button"
              onClick={() => toggleStatus(log.id)}
              aria-label={
                log.status === "done"
                  ? "予定に戻す"
                  : "完了済みにする"
              }
              className={cn(
                "absolute -left-[7px] top-0.5 w-3 h-3 rounded-full border-2 border-paper tap-44 p-0",
                log.status === "done" ? "bg-clay" : "bg-surface border-ink-faint"
              )}
              style={{ marginLeft: "5px" }}
            />
            <div
              className={cn(
                "text-[11px] font-bold tracking-wide",
                log.status === "done" ? "text-clay" : "text-ink-faint"
              )}
            >
              {formatDate(log.logDate)}
              {log.status === "planned" && (
                <span className="ml-1.5 text-[10px] text-ink-faint">（予定）</span>
              )}
            </div>
            <div className="text-[14px] font-bold mt-0.5 mb-1.5">
              {log.title}
            </div>
            {(log.saidUs || log.saidThem) && (
              <div className="bg-surface border border-line rounded-[11px] px-3 py-2.5 text-[12.5px] leading-[1.5]">
                {log.saidUs && (
                  <div className="mb-1.5">
                    <span className="text-[10px] font-bold text-ink-faint tracking-wider">
                      伝えたこと
                    </span>
                    <div className="whitespace-pre-wrap">{log.saidUs}</div>
                  </div>
                )}
                {log.saidThem && (
                  <div className="text-ink-soft">
                    <span className="text-[10px] font-bold text-ink-faint tracking-wider">
                      担当の方の回答
                    </span>
                    <div className="whitespace-pre-wrap">{log.saidThem}</div>
                  </div>
                )}
              </div>
            )}
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(log)}
                className="text-[11px] text-ink-soft underline underline-offset-2 tap-44 px-1 py-0.5"
              >
                編集
              </button>
              <button
                type="button"
                onClick={() => handleDelete(log.id)}
                className="text-[11px] text-ink-faint hover:text-clay tap-44 px-1 py-0.5"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      <LogEditModal
        open={!!editing}
        initial={
          editing
            ? {
                logDate: editing.logDate,
                title: editing.title,
                saidUs: editing.saidUs,
                saidThem: editing.saidThem,
                status: editing.status,
              }
            : null
        }
        title="記録を編集"
        submitLabel="保存"
        onClose={() => setEditing(null)}
        onSubmit={handleSave}
      />
    </>
  );
}

function formatDate(iso: string) {
  // YYYY-MM-DD → YYYY/MM/DD
  return iso.replace(/-/g, "/");
}
