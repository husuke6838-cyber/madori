"use client";

import { useState, useTransition } from "react";
import { LogEditModal, type LogForm } from "./LogEditModal";
import { addMeetingLogAction } from "./actions";

export function AddLogFAB({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleAdd = (form: LogForm) => {
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("log_date", form.logDate);
    fd.set("title", form.title);
    fd.set("said_us", form.saidUs);
    fd.set("said_them", form.saidThem);
    fd.set("status", form.status);
    startTransition(async () => {
      await addMeetingLogAction(fd);
      setOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="打ち合わせ記録を追加"
        disabled={pending}
        className="fixed right-5 bottom-24 z-20 w-14 h-14 rounded-2xl text-white text-2xl font-bold shadow-[0_12px_24px_-7px_rgba(189,93,58,0.55)] bg-gradient-to-br from-clay to-[#a84e30] grid place-items-center disabled:opacity-60"
      >
        ＋
      </button>
      <LogEditModal
        open={open}
        initial={null}
        title="打ち合わせ記録を追加"
        submitLabel="追加する"
        onClose={() => setOpen(false)}
        onSubmit={handleAdd}
      />
    </>
  );
}
