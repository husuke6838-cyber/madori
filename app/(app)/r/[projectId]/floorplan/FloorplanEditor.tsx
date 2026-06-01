"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import {
  cellsToJou,
  summarizeFloorplan,
  type FloorplanData,
  type RoomShape,
  ROOM_TYPE_PRESETS,
  FLOORPLAN_MAX,
} from "@/lib/floorplan";
import { DISCLAIMER_COST } from "@/lib/constants";
import {
  createFloorplanAction,
  deleteFloorplanAction,
  duplicateFloorplanAction,
  renameFloorplanAction,
  saveFloorplanDataAction,
} from "./actions";

// react-konva は window 依存なので SSR を切る（仕様§2）
const FloorplanCanvas = dynamic(() => import("./FloorplanCanvas"), {
  ssr: false,
  loading: () => (
    <div className="h-[430px] grid place-items-center text-ink-faint text-sm">
      キャンバスを準備中…
    </div>
  ),
});

export function FloorplanEditor({
  projectId,
  floorplans,
  current,
  error,
}: {
  projectId: string;
  floorplans: { id: string; name: string }[];
  current: {
    id: string;
    name: string;
    gridUnitMm: number;
    data: FloorplanData;
  };
  error?: string;
}) {
  const [data, setData] = useState<FloorplanData>(current.data);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState(current.name);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">(
    "saved"
  );
  const [, startTransition] = useTransition();

  // debounce 保存
  const scheduleSave = (next: FloorplanData) => {
    setSaveState("dirty");
    (scheduleSave as unknown as { timer?: ReturnType<typeof setTimeout> }).timer &&
      clearTimeout(
        (scheduleSave as unknown as { timer?: ReturnType<typeof setTimeout> }).timer
      );
    (scheduleSave as unknown as { timer?: ReturnType<typeof setTimeout> }).timer =
      setTimeout(async () => {
        setSaveState("saving");
        await saveFloorplanDataAction(projectId, current.id, next);
        setSaveState("saved");
      }, 800);
  };

  const updateData = (mut: (d: FloorplanData) => FloorplanData) => {
    setData((prev) => {
      const next = mut(prev);
      scheduleSave(next);
      return next;
    });
  };

  const summary = useMemo(() => summarizeFloorplan(data.rooms), [data.rooms]);

  const selectedRoom = data.rooms.find((r) => r.id === selectedId) ?? null;

  const addRoom = (typeKey: string) => {
    const preset = ROOM_TYPE_PRESETS[typeKey];
    const id = crypto.randomUUID();
    const newRoom: RoomShape = {
      id,
      x: 2,
      y: 2,
      w: preset.w,
      h: preset.h,
      label: preset.label,
      type: typeKey,
    };
    updateData((d) => ({ ...d, rooms: [...d.rooms, newRoom] }));
    setSelectedId(id);
    setShowAdd(false);
  };

  const updateRoom = (id: string, patch: Partial<RoomShape>) => {
    updateData((d) => ({
      ...d,
      rooms: d.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    updateData((d) => ({
      ...d,
      rooms: d.rooms.filter((r) => r.id !== selectedId),
    }));
    setSelectedId(null);
  };

  const handleDeleteFloorplan = () => {
    if (!confirm(`「${current.name}」を削除します。元に戻せません。`)) return;
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("floorplanId", current.id);
    startTransition(async () => {
      await deleteFloorplanAction(fd);
    });
  };

  const handleRename = () => {
    if (!newName.trim()) return;
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("floorplanId", current.id);
    fd.set("name", newName.trim());
    startTransition(async () => {
      await renameFloorplanAction(fd);
      setRenameOpen(false);
    });
  };

  return (
    <div>
      <div className="px-4 pt-3 flex items-center gap-2">
        <span className="font-mincho text-[22px]">間取り</span>
        <button
          type="button"
          onClick={() => {
            setNewName(current.name);
            setRenameOpen(true);
          }}
          className="text-[11px] text-ink-soft underline underline-offset-2 ml-1 tap-44 px-1 py-0.5"
        >
          ✎ {current.name}
        </button>
        <span
          className="ml-auto text-[10px] text-ink-faint"
          aria-live="polite"
        >
          {saveState === "saving"
            ? "保存中..."
            : saveState === "dirty"
            ? "変更あり"
            : "✓ 保存済み"}
        </span>
      </div>

      {error && (
        <p className="mx-4 mt-2 text-xs bg-clay-soft text-[#8a3d20] border border-[#ecc7b3] rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

      <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-3 [&::-webkit-scrollbar]:h-0 [scrollbar-width:none]">
        {floorplans.map((f) => (
          <Link
            key={f.id}
            href={`/r/${projectId}/floorplan?fp=${f.id}`}
            className={`flex-shrink-0 text-[12.5px] font-bold px-3.5 py-1.5 rounded-[18px] border tap-44 ${
              f.id === current.id
                ? "bg-clay text-white border-clay shadow-[0_3px_9px_rgba(189,93,58,0.28)]"
                : "bg-surface-2 text-ink-soft border-line"
            }`}
          >
            {f.name}
          </Link>
        ))}
        {floorplans.length < FLOORPLAN_MAX ? (
          <form action={createFloorplanAction} className="flex-shrink-0">
            <input type="hidden" name="projectId" value={projectId} />
            <input
              type="hidden"
              name="name"
              value={`案${String.fromCharCode(64 + floorplans.length + 1)}`}
            />
            <button
              type="submit"
              className="text-[12.5px] font-bold px-3 py-1.5 rounded-[18px] border border-dashed border-clay text-clay tap-44"
            >
              ＋
            </button>
          </form>
        ) : (
          <span className="flex-shrink-0 text-[12.5px] font-bold px-3 py-1.5 rounded-[18px] border border-dashed border-ink-faint text-ink-faint">
            最大{FLOORPLAN_MAX}個
          </span>
        )}
        <form action={duplicateFloorplanAction} className="flex-shrink-0 ml-auto">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="floorplanId" value={current.id} />
          <button
            type="submit"
            disabled={floorplans.length >= FLOORPLAN_MAX}
            className="text-[11.5px] font-bold px-3 py-1.5 rounded-[18px] border border-line bg-surface text-ink-soft tap-44 disabled:opacity-40"
            title="この間取りを複製"
          >
            ⧉ 複製
          </button>
        </form>
      </div>

      <SummaryCard summary={summary} />

      <div className="mt-3 bg-paper">
        <FloorplanCanvas
          data={data}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRoomChange={updateRoom}
        />
      </div>

      <div className="px-4 py-3 border-t border-line bg-surface-2/60">
        {selectedRoom ? (
          <SelectedRoomPanel
            room={selectedRoom}
            onChange={(p) => updateRoom(selectedRoom.id, p)}
            onDelete={deleteSelected}
          />
        ) : (
          <>
            <p className="text-center text-[11px] text-ink-faint mb-2">
              「＋ 部屋」を押して配置／部屋をタップで選択
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="flex-shrink-0 flex flex-col items-center gap-1 border border-line bg-surface rounded-xl px-3 py-2.5 text-[11px] font-bold text-ink-soft min-w-[64px] tap-44"
              >
                <span className="text-lg">＋</span>
                部屋
              </button>
              <DisabledTool icon="🚪" label="開き戸" />
              <DisabledTool icon="🚪↔" label="引き戸" />
              <DisabledTool icon="▭" label="窓" />
              <DisabledTool icon="🍳" label="キッチン" />
              <DisabledTool icon="🛁" label="浴室" />
              <DisabledTool icon="🪜" label="階段" />
            </div>
            <p className="text-[10px] text-ink-faint text-center mt-1">
              建具・設備スタンプ・PNG出力は Stage 2 で実装予定
            </p>
          </>
        )}
      </div>

      <div className="px-4 py-3 flex justify-between text-[11px] text-ink-faint">
        <button
          type="button"
          onClick={handleDeleteFloorplan}
          className="text-ink-faint hover:text-clay underline underline-offset-2 tap-44 px-1 py-0.5"
        >
          この間取りを削除
        </button>
      </div>

      {/* 部屋追加モーダル */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="どんな部屋を追加しますか？"
      >
        <div className="grid grid-cols-3 gap-2">
          {Object.keys(ROOM_TYPE_PRESETS).map((key) => {
            const p = ROOM_TYPE_PRESETS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => addRoom(key)}
                className="border border-line bg-surface rounded-xl px-2 py-3 text-center tap-44 active:bg-surface-2"
              >
                <div className="font-mincho text-[14px]">{p.label}</div>
                <div className="text-[10px] text-ink-faint mt-0.5">
                  {p.w}×{p.h} ({cellsToJou(p.w, p.h)}帖)
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-ink-faint mt-3 leading-relaxed">
          ※ 配置後にサイズ・名前は自由に変更できます
        </p>
      </Modal>

      {/* 名前変更モーダル */}
      <Modal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="間取りの名前を変更"
      >
        <Label htmlFor="fp-name">名前</Label>
        <Input
          id="fp-name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="例: 1階 / 2階 / 案A"
          autoFocus
        />
        <div className="mt-4 flex gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => setRenameOpen(false)}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1"
            onClick={handleRename}
            disabled={!newName.trim()}
          >
            保存
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function DisabledTool({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      disabled
      className="flex-shrink-0 flex flex-col items-center gap-1 border border-line bg-surface-2 rounded-xl px-3 py-2.5 text-[11px] font-bold text-ink-faint min-w-[64px] opacity-50"
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

function SelectedRoomPanel({
  room,
  onChange,
  onDelete,
}: {
  room: RoomShape;
  onChange: (patch: Partial<RoomShape>) => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <input
          type="text"
          value={room.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="font-mincho text-[16px] bg-surface border border-line rounded-lg px-2.5 py-1.5 flex-1 focus:outline-none focus:border-clay"
          maxLength={30}
        />
        <span className="text-[11px] font-bold text-[#9c6a3a] bg-[#f6ead9] border border-[#ecd6bd] px-2.5 py-1 rounded-full">
          {cellsToJou(room.w, room.h)}帖
        </span>
      </div>
      <div className="flex items-center gap-2 text-[12px] text-ink-soft mb-2">
        <span>サイズ：</span>
        <SizeStepper
          value={room.w}
          onChange={(w) => onChange({ w: Math.max(1, w) })}
          label="幅"
        />
        ×
        <SizeStepper
          value={room.h}
          onChange={(h) => onChange({ h: Math.max(1, h) })}
          label="高"
        />
        <span className="text-ink-faint text-[10px]">マス（910mm/マス）</span>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={onDelete}
          className="ml-auto text-[12px] text-clay border border-clay-soft bg-clay-soft px-3 py-2 rounded-lg font-bold tap-44"
        >
          🗑 この部屋を削除
        </button>
      </div>
    </div>
  );
}

function SizeStepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <span className="inline-flex items-center bg-surface border border-line rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label={`${label}を1マス減らす`}
        className="px-2.5 py-1 text-ink-soft tap-44"
      >
        −
      </button>
      <span className="px-2 text-[12px] font-bold tabular-nums w-6 text-center">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label={`${label}を1マス増やす`}
        className="px-2.5 py-1 text-ink-soft tap-44"
      >
        ＋
      </button>
    </span>
  );
}

function SummaryCard({
  summary,
}: {
  summary: ReturnType<typeof summarizeFloorplan>;
}) {
  return (
    <div className="mx-4 mt-1 bg-gradient-to-br from-[#fff7ef] to-[#fdefe0] border border-[#f0dcc7] rounded-[14px] px-4 py-3">
      <SummaryRow
        label="要望サイズの合計（居室）"
        value={`${summary.totalJou}帖 / 約${summary.livingTsubo}坪`}
      />
      <SummaryRow
        label="延床の目安（廊下・水回り込み）"
        value={`約${summary.totalFloorTsubo}坪`}
      />
      <SummaryRow
        label="概算建築費"
        value={
          summary.totalFloorTsubo > 0
            ? `約${summary.buildCostLow.toLocaleString()}〜${summary.buildCostHigh.toLocaleString()}万円`
            : "—"
        }
      />
      <SummaryRow
        label="固定資産税 初年度の目安"
        value={
          summary.totalFloorTsubo > 0
            ? `年 約${summary.taxYearLow}〜${summary.taxYearHigh}万円`
            : "—"
        }
      />
      <p className="text-[10px] text-[#a8754a] mt-2 leading-relaxed">
        ※ {DISCLAIMER_COST}
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-0.5 text-[13px]">
      <span className="text-ink-soft text-[12px]">{label}</span>
      <b className="font-mincho text-[16px]">{value}</b>
    </div>
  );
}
