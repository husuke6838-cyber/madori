"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { FAMILY_PALETTE } from "@/lib/seeds";
import {
  addFamilyMemberAction,
  deleteFamilyMemberAction,
  updateFamilyMemberAction,
} from "./family-actions";

export type FamilyMember = {
  id: string;
  name: string;
  color: string;
};

export function FamilyChips({
  projectId,
  members,
}: {
  projectId: string;
  members: FamilyMember[];
}) {
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5 px-4 pt-3 pb-1">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setEditing(m)}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1.5 rounded-full tap-44"
            style={{ background: m.color + "22", color: darken(m.color) }}
          >
            <span
              className="w-[7px] h-[7px] rounded-full"
              style={{ background: m.color }}
            />
            {m.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="border border-dashed border-ink-faint bg-transparent text-ink-soft text-[11.5px] font-bold px-2.5 py-1.5 rounded-full tap-44"
        >
          ＋ 家族
        </button>
      </div>

      <MemberAddModal
        open={adding}
        onClose={() => setAdding(false)}
        projectId={projectId}
        excludeColors={members.map((m) => m.color)}
      />
      <MemberEditModal
        open={!!editing}
        onClose={() => setEditing(null)}
        member={editing}
      />
    </>
  );
}

function MemberAddModal({
  open,
  onClose,
  projectId,
  excludeColors,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  excludeColors: string[];
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(
    FAMILY_PALETTE.find((p) => !excludeColors.includes(p.color))?.color ??
      FAMILY_PALETTE[0].color
  );
  const [pending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!name.trim()) return;
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("name", name.trim());
    fd.set("color", color);
    startTransition(async () => {
      await addFamilyMemberAction(fd);
      setName("");
      onClose();
    });
  };

  return (
    <Modal open={open} onClose={() => !pending && onClose()} title="家族を追加">
      <div className="space-y-3">
        <div>
          <Label htmlFor="add-name">名前</Label>
          <Input
            id="add-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: お子さん / おじいちゃん"
            maxLength={40}
            autoFocus
          />
        </div>
        <ColorPicker value={color} onChange={setColor} />
        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onClose}
            disabled={pending}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1"
            onClick={handleAdd}
            disabled={pending || !name.trim()}
          >
            {pending ? "追加中..." : "追加"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function MemberEditModal({
  open,
  onClose,
  member,
}: {
  open: boolean;
  onClose: () => void;
  member: FamilyMember | null;
}) {
  return open && member ? (
    <MemberEditModalInner
      open={open}
      onClose={onClose}
      member={member}
      key={member.id}
    />
  ) : null;
}

function MemberEditModalInner({
  open,
  onClose,
  member,
}: {
  open: boolean;
  onClose: () => void;
  member: FamilyMember;
}) {
  const [name, setName] = useState(member.name);
  const [color, setColor] = useState(member.color);
  const [pending, startTransition] = useTransition();

  const handleSave = () => {
    if (!name.trim()) return;
    const fd = new FormData();
    fd.set("memberId", member.id);
    fd.set("name", name.trim());
    fd.set("color", color);
    startTransition(async () => {
      await updateFamilyMemberAction(fd);
      onClose();
    });
  };

  const handleDelete = () => {
    if (
      !confirm(
        `「${member.name}」を削除します。この家族メンバーの★評価もすべて削除されます。よろしいですか？`
      )
    )
      return;
    const fd = new FormData();
    fd.set("memberId", member.id);
    startTransition(async () => {
      try {
        await deleteFamilyMemberAction(fd);
        onClose();
      } catch (e) {
        alert(String((e as Error).message ?? e));
      }
    });
  };

  return (
    <Modal
      open={open}
      onClose={() => !pending && onClose()}
      title={`「${member.name}」を編集`}
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="edit-name">名前</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
          />
        </div>
        <ColorPicker value={color} onChange={setColor} />
        <div className="flex gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onClose}
            disabled={pending}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1"
            onClick={handleSave}
            disabled={pending || !name.trim()}
          >
            {pending ? "保存中..." : "保存"}
          </Button>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="w-full text-[12px] text-clay underline underline-offset-2 mt-1 tap-44"
        >
          このメンバーを削除する
        </button>
      </div>
    </Modal>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div>
      <Label>色</Label>
      <div className="flex flex-wrap gap-2 mt-1">
        {FAMILY_PALETTE.map((p) => (
          <button
            key={p.color}
            type="button"
            onClick={() => onChange(p.color)}
            aria-label={`色 ${p.name}`}
            className={`w-10 h-10 rounded-full border-2 tap-44 ${
              value === p.color ? "border-ink" : "border-white"
            }`}
            style={{ background: p.color }}
          />
        ))}
      </div>
    </div>
  );
}

function darken(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * 0.7)},${Math.round(g * 0.7)},${Math.round(
    b * 0.7
  )})`;
}
