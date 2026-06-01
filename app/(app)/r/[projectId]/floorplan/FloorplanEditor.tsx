"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import {
  cellsToJou,
  summarizeFloorplan,
  type FloorplanData,
  type RoomShape,
  type DoorShape,
  type WindowShape,
  type FixtureShape,
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
  exportFloorplanPngAction,
} from "./actions";
import type { CanvasHandle, Selection } from "./FloorplanCanvas";
import { FloorplanToolSidebar } from "./FloorplanToolSidebar";

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
  const [selected, setSelected] = useState<Selection>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState(current.name);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">("saved");
  const [exporting, setExporting] = useState(false);
  const [zoom, setZoom] = useState(0.6);
  const [, startTransition] = useTransition();
  const canvasRef = useRef<CanvasHandle>(null);

  const clampZoom = (z: number) => Math.max(0.3, Math.min(2, Math.round(z * 100) / 100));
  const zoomIn = () => setZoom((z) => clampZoom(z + 0.1));
  const zoomOut = () => setZoom((z) => clampZoom(z - 0.1));
  const fitToScreen = () => {
    const w = canvasRef.current?.getViewportWidth() ?? 0;
    if (w > 0) setZoom(clampZoom(w / (30 * 26)));
  };

  const scheduleSave = (next: FloorplanData) => {
    setSaveState("dirty");
    const slot = scheduleSave as unknown as {
      timer?: ReturnType<typeof setTimeout>;
    };
    if (slot.timer) clearTimeout(slot.timer);
    slot.timer = setTimeout(async () => {
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

  // 部屋
  const addRoom = (typeKey: string) => {
    const preset = ROOM_TYPE_PRESETS[typeKey];
    const id = crypto.randomUUID();
    const newRoom: RoomShape = {
      id, x: 2, y: 2, w: preset.w, h: preset.h, label: preset.label, type: typeKey,
    };
    updateData((d) => ({ ...d, rooms: [...d.rooms, newRoom] }));
    setSelected({ type: "room", id });
    setShowAddRoom(false);
  };
  const updateRoom = (id: string, patch: Partial<RoomShape>) =>
    updateData((d) => ({
      ...d,
      rooms: d.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));

  // 建具
  const addDoor = (kind: DoorShape["kind"]) => {
    const id = crypto.randomUUID();
    const newDoor: DoorShape = {
      id, x: 10, y: 10, w: 2, h: 1, rot: 0, kind, swing: "left", open: "in",
    };
    updateData((d) => ({ ...d, doors: [...d.doors, newDoor] }));
    setSelected({ type: "door", id });
  };
  const updateDoor = (id: string, patch: Partial<DoorShape>) =>
    updateData((d) => ({
      ...d,
      doors: d.doors.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));

  // 窓
  const addWindow = () => {
    const id = crypto.randomUUID();
    const newWin: WindowShape = { id, x: 10, y: 10, w: 3, h: 1, rot: 0 };
    updateData((d) => ({ ...d, windows: [...d.windows, newWin] }));
    setSelected({ type: "window", id });
  };
  const updateWindow = (id: string, patch: Partial<WindowShape>) =>
    updateData((d) => ({
      ...d,
      windows: d.windows.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));

  // 設備
  const addFixture = (kind: FixtureShape["kind"]) => {
    const id = crypto.randomUUID();
    const dims = FIXTURE_DEFAULTS[kind];
    const newFx: FixtureShape = {
      id, x: 10, y: 10, w: dims.w, h: dims.h, rot: 0, kind,
    };
    updateData((d) => ({ ...d, fixtures: [...d.fixtures, newFx] }));
    setSelected({ type: "fixture", id });
  };
  const updateFixture = (id: string, patch: Partial<FixtureShape>) =>
    updateData((d) => ({
      ...d,
      fixtures: d.fixtures.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));

  // 削除
  const deleteSelected = () => {
    if (!selected) return;
    updateData((d) => {
      switch (selected.type) {
        case "room":    return { ...d, rooms: d.rooms.filter((x) => x.id !== selected.id) };
        case "door":    return { ...d, doors: d.doors.filter((x) => x.id !== selected.id) };
        case "window":  return { ...d, windows: d.windows.filter((x) => x.id !== selected.id) };
        case "fixture": return { ...d, fixtures: d.fixtures.filter((x) => x.id !== selected.id) };
      }
    });
    setSelected(null);
  };

  // 回転
  const rotateSelected = () => {
    if (!selected || selected.type === "room") return;
    const cycle = (r: number) => (((r + 90) % 360) as DoorShape["rot"]);
    if (selected.type === "door") {
      const cur = data.doors.find((x) => x.id === selected.id);
      if (cur) updateDoor(cur.id, { rot: cycle(cur.rot) });
    } else if (selected.type === "window") {
      const cur = data.windows.find((x) => x.id === selected.id);
      if (cur) updateWindow(cur.id, { rot: cycle(cur.rot) });
    } else if (selected.type === "fixture") {
      const cur = data.fixtures.find((x) => x.id === selected.id);
      if (cur) updateFixture(cur.id, { rot: cycle(cur.rot) });
    }
  };

  const flipSelected = () => {
    if (!selected || selected.type !== "door") return;
    const cur = data.doors.find((x) => x.id === selected.id);
    if (cur) updateDoor(cur.id, { swing: cur.swing === "left" ? "right" : "left" });
  };

  // PNG 書き出し
  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL();
    if (!dataUrl) return;

    setExporting(true);
    try {
      // 1) ダウンロード（手元保存）
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `間取り-${current.name}.png`;
      a.click();

      // 2) サーバ側にも保存（計画書・共有ビューへの埋め込み用）
      await exportFloorplanPngAction(projectId, current.id, dataUrl);
    } finally {
      setExporting(false);
    }
  };

  // 間取り CRUD
  const handleDeleteFloorplan = () => {
    if (!confirm(`「${current.name}」を削除します。元に戻せません。`)) return;
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("floorplanId", current.id);
    startTransition(async () => { await deleteFloorplanAction(fd); });
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

  // 選択中要素のラベル
  const selectionLabel = (() => {
    if (!selected) return null;
    if (selected.type === "room") {
      return data.rooms.find((r) => r.id === selected.id)?.label ?? "部屋";
    }
    if (selected.type === "door") {
      const d = data.doors.find((x) => x.id === selected.id);
      return d ? DOOR_LABELS[d.kind] : "建具";
    }
    if (selected.type === "window") return "窓";
    if (selected.type === "fixture") {
      const f = data.fixtures.find((x) => x.id === selected.id);
      return f ? FIXTURE_LABELS[f.kind] : "設備";
    }
    return null;
  })();

  return (
    <div>
      <div className="px-4 pt-3 flex items-center gap-2">
        <span className="font-mincho text-[22px]">間取り</span>
        <button
          type="button"
          onClick={() => { setNewName(current.name); setRenameOpen(true); }}
          className="text-[11px] text-ink-soft underline underline-offset-2 ml-1 tap-44 px-1 py-0.5"
        >
          ✎ {current.name}
        </button>
        <span className="ml-auto text-[10px] text-ink-faint" aria-live="polite">
          {saveState === "saving" ? "保存中..." : saveState === "dirty" ? "変更あり" : "✓ 保存済み"}
        </span>
      </div>

      {error && (
        <p className="mx-4 mt-2 text-xs bg-clay-soft text-[#8a3d20] border border-[#ecc7b3] rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

      {/* 間取りタブ */}
      <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
        {floorplans.map((f) => (
          <Link key={f.id} href={`/r/${projectId}/floorplan?fp=${f.id}`}
            className={`flex-shrink-0 text-[12.5px] font-bold px-3.5 py-1.5 rounded-[18px] border tap-44 ${
              f.id === current.id
                ? "bg-clay text-white border-clay shadow-[0_3px_9px_rgba(189,93,58,0.28)]"
                : "bg-surface-2 text-ink-soft border-line"
            }`}>
            {f.name}
          </Link>
        ))}
        {floorplans.length < FLOORPLAN_MAX ? (
          <form action={createFloorplanAction} className="flex-shrink-0">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="name" value={`案${String.fromCharCode(64 + floorplans.length + 1)}`} />
            <button type="submit" className="text-[12.5px] font-bold px-3 py-1.5 rounded-[18px] border border-dashed border-clay text-clay tap-44">
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
          <button type="submit" disabled={floorplans.length >= FLOORPLAN_MAX}
            className="text-[11.5px] font-bold px-3 py-1.5 rounded-[18px] border border-line bg-surface text-ink-soft tap-44 disabled:opacity-40">
            ⧉ 複製
          </button>
        </form>
      </div>

      <SummaryCard summary={summary} />

      <div className="mt-3 flex">
        <div className="flex-1 min-w-0">
          <FloorplanCanvas
            ref={canvasRef}
            data={data}
            selected={selected}
            zoom={zoom}
            onSelect={setSelected}
            onRoomChange={updateRoom}
            onDoorChange={updateDoor}
            onWindowChange={updateWindow}
            onFixtureChange={updateFixture}
          />
        </div>
        <FloorplanToolSidebar
          topContent={
            <SidebarTop
              zoom={zoom}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onReset={() => setZoom(1)}
              onFit={fitToScreen}
              selected={selected}
              selectionLabel={selectionLabel}
              canRotate={!!selected && selected.type !== "room"}
              canFlip={selected?.type === "door"}
              onRotate={rotateSelected}
              onFlip={flipSelected}
              onDelete={deleteSelected}
            />
          }
          sections={[
            {
              id: "room",
              title: "部屋",
              icon: "▦",
              tools: [
                {
                  icon: "＋",
                  label: "部屋",
                  onClick: () => setShowAddRoom(true),
                },
              ],
            },
            {
              id: "door",
              title: "建具",
              icon: "🚪",
              tools: [
                { icon: "🚪", label: "開き戸", onClick: () => addDoor("hinged") },
                { icon: "↔", label: "引き戸", onClick: () => addDoor("sliding") },
                { icon: "⌐", label: "折れ戸", onClick: () => addDoor("folding") },
              ],
            },
            {
              id: "window",
              title: "窓",
              icon: "▭",
              tools: [{ icon: "▭", label: "窓", onClick: addWindow }],
            },
            {
              id: "fixture",
              title: "設備",
              icon: "🍳",
              tools: [
                { icon: "🍳", label: "I型", onClick: () => addFixture("kitchen-i") },
                { icon: "🍳", label: "L型", onClick: () => addFixture("kitchen-l") },
                { icon: "🍳", label: "島", onClick: () => addFixture("kitchen-island") },
                { icon: "🛁", label: "浴槽", onClick: () => addFixture("bath") },
                { icon: "🚰", label: "洗面", onClick: () => addFixture("washbasin") },
                { icon: "🚽", label: "トイレ", onClick: () => addFixture("toilet") },
                { icon: "🪜", label: "階段", onClick: () => addFixture("stairs") },
                { icon: "🗄", label: "収納", onClick: () => addFixture("closet") },
                { icon: "👞", label: "玄関", onClick: () => addFixture("entrance") },
              ],
            },
          ]}
        />
      </div>

      {/* キャンバス下：詳細編集（部屋名・サイズ・窓幅 など）。
          回転/反転/削除は右サイドバーに移動済み。 */}
      {selected?.type === "room" && (
        <div className="px-4 py-3 border-t border-line bg-surface-2/60">
          <SelectedRoomPanel
            room={data.rooms.find((r) => r.id === selected.id)!}
            onChange={(p) => updateRoom(selected.id, p)}
          />
        </div>
      )}
      {selected?.type === "window" && (
        <div className="px-4 py-3 border-t border-line bg-surface-2/60">
          <SelectedWindowPanel
            win={data.windows.find((w) => w.id === selected.id)!}
            onChange={(p) => updateWindow(selected.id, p)}
          />
        </div>
      )}
      {!selected && (
        <div className="px-4 py-2 text-center text-[10px] text-ink-faint border-t border-line">
          右の ▼ で項目展開 → タップで配置／既存をタップで選択
        </div>
      )}

      <ArchitecturalHints rooms={data.rooms} windows={data.windows} />

      <div className="px-4 py-3 flex items-center gap-2 text-[11px]">
        <Button type="button" size="md" onClick={handleExportPng} disabled={exporting}>
          {exporting ? "書き出し中..." : "🖼 PNGに書き出す"}
        </Button>
        <span className="text-ink-faint">
          計画書・共有リンクにも自動で添付されます
        </span>
        <button type="button" onClick={handleDeleteFloorplan}
          className="ml-auto text-ink-faint hover:text-clay underline underline-offset-2 tap-44 px-1 py-0.5">
          この間取りを削除
        </button>
      </div>

      {/* 部屋追加モーダル */}
      <Modal open={showAddRoom} onClose={() => setShowAddRoom(false)} title="どんな部屋を追加しますか？">
        <div className="grid grid-cols-3 gap-2">
          {Object.keys(ROOM_TYPE_PRESETS).map((key) => {
            const p = ROOM_TYPE_PRESETS[key];
            return (
              <button key={key} type="button" onClick={() => addRoom(key)}
                className="border border-line bg-surface rounded-xl px-2 py-3 text-center tap-44 active:bg-surface-2">
                <div className="font-mincho text-[14px]">{p.label}</div>
                <div className="text-[10px] text-ink-faint mt-0.5">{p.w}×{p.h} ({cellsToJou(p.w, p.h)}帖)</div>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-ink-faint mt-3 leading-relaxed">
          ※ 配置後にサイズ・名前は自由に変更できます
        </p>
      </Modal>

      {/* 名前変更モーダル */}
      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="間取りの名前を変更">
        <Label htmlFor="fp-name">名前</Label>
        <Input id="fp-name" value={newName} onChange={(e) => setNewName(e.target.value)}
          placeholder="例: 1階 / 2階 / 案A" autoFocus />
        <div className="mt-4 flex gap-2.5">
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setRenameOpen(false)}>
            キャンセル
          </Button>
          <Button type="button" size="lg" className="flex-1" onClick={handleRename} disabled={!newName.trim()}>
            保存
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function SidebarTop({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
  selected,
  selectionLabel,
  canRotate,
  canFlip,
  onRotate,
  onFlip,
  onDelete,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
  selected: Selection;
  selectionLabel: string | null;
  canRotate: boolean;
  canFlip: boolean;
  onRotate: () => void;
  onFlip: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      {/* ズーム */}
      <div className="border-b border-line bg-paper/60 px-1 py-2">
        <div className="text-[8.5px] font-bold tracking-wider text-center text-ink-faint mb-1">
          ZOOM
        </div>
        <div className="flex justify-center gap-0.5">
          <button
            type="button"
            onClick={onZoomOut}
            aria-label="ズームアウト"
            className="w-7 h-7 grid place-items-center rounded-md bg-surface border border-line text-ink-soft active:bg-surface-2 tap-44"
          >
            −
          </button>
          <button
            type="button"
            onClick={onReset}
            className="text-[10px] font-bold text-ink-soft px-1 grid place-items-center min-w-[28px] tap-44"
            title="100%にリセット"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            aria-label="ズームイン"
            className="w-7 h-7 grid place-items-center rounded-md bg-surface border border-line text-ink-soft active:bg-surface-2 tap-44"
          >
            ＋
          </button>
        </div>
        <button
          type="button"
          onClick={onFit}
          className="w-full mt-1.5 text-[10px] font-bold text-clay border border-clay-soft bg-clay-soft/40 rounded-md py-1 tap-44"
        >
          ⛶ 全体
        </button>
      </div>

      {/* 選択中アクション */}
      {selected && (
        <div className="border-b border-line bg-clay-soft/30 px-1 py-2">
          <div className="text-[9px] font-bold text-clay text-center mb-1.5 truncate">
            {selectionLabel}
          </div>
          {canRotate && (
            <button
              type="button"
              onClick={onRotate}
              className="w-full flex flex-col items-center py-1.5 text-[9.5px] font-bold text-ink-soft active:bg-surface-2 rounded tap-44"
            >
              <span className="text-base leading-none">↻</span>
              90°回転
            </button>
          )}
          {canFlip && (
            <button
              type="button"
              onClick={onFlip}
              className="w-full flex flex-col items-center py-1.5 text-[9.5px] font-bold text-ink-soft active:bg-surface-2 rounded tap-44"
            >
              <span className="text-base leading-none">⇋</span>
              左右反転
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="w-full flex flex-col items-center py-1.5 text-[9.5px] font-bold text-clay active:bg-clay/10 rounded tap-44"
          >
            <span className="text-base leading-none">🗑</span>
            削除
          </button>
        </div>
      )}
    </>
  );
}

function SelectedRoomPanel({
  room, onChange,
}: { room: RoomShape; onChange: (p: Partial<RoomShape>) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <input type="text" value={room.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="font-mincho text-[16px] bg-surface border border-line rounded-lg px-2.5 py-1.5 flex-1 focus:outline-none focus:border-clay" maxLength={30} />
        <span className="text-[11px] font-bold text-[#9c6a3a] bg-[#f6ead9] border border-[#ecd6bd] px-2.5 py-1 rounded-full">
          {cellsToJou(room.w, room.h)}帖
        </span>
      </div>
      <div className="flex items-center gap-2 text-[12px] text-ink-soft">
        <span>サイズ：</span>
        <SizeStepper value={room.w} onChange={(w) => onChange({ w: Math.max(1, w) })} label="幅" /> ×
        <SizeStepper value={room.h} onChange={(h) => onChange({ h: Math.max(1, h) })} label="高" />
        <span className="text-ink-faint text-[10px]">マス（910mm/マス）</span>
      </div>
    </div>
  );
}

function SelectedWindowPanel({
  win, onChange,
}: { win: WindowShape; onChange: (p: Partial<WindowShape>) => void }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-ink-soft">
      <span>幅：</span>
      <SizeStepper value={win.w} onChange={(w) => onChange({ w: Math.max(1, w) })} label="幅" />
      <span className="text-ink-faint text-[10px]">マス（910mm/マス）</span>
    </div>
  );
}

function SizeStepper({
  value, onChange, label,
}: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <span className="inline-flex items-center bg-surface border border-line rounded-lg overflow-hidden">
      <button type="button" onClick={() => onChange(value - 1)} aria-label={`${label}を1マス減らす`}
        className="px-2.5 py-1 text-ink-soft tap-44">−</button>
      <span className="px-2 text-[12px] font-bold tabular-nums w-6 text-center">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} aria-label={`${label}を1マス増やす`}
        className="px-2.5 py-1 text-ink-soft tap-44">＋</button>
    </span>
  );
}

function SummaryCard({ summary }: { summary: ReturnType<typeof summarizeFloorplan> }) {
  return (
    <div className="mx-4 mt-1 bg-gradient-to-br from-[#fff7ef] to-[#fdefe0] border border-[#f0dcc7] rounded-[14px] px-4 py-3">
      <SummaryRow label="要望サイズの合計（居室）" value={`${summary.totalJou}帖 / 約${summary.livingTsubo}坪`} />
      <SummaryRow label="延床の目安（廊下・水回り込み）" value={`約${summary.totalFloorTsubo}坪`} />
      <SummaryRow label="概算建築費" value={summary.totalFloorTsubo > 0 ? `約${summary.buildCostLow.toLocaleString()}〜${summary.buildCostHigh.toLocaleString()}万円` : "—"} />
      <SummaryRow label="固定資産税 初年度の目安" value={summary.totalFloorTsubo > 0 ? `年 約${summary.taxYearLow}〜${summary.taxYearHigh}万円` : "—"} />
      <p className="text-[10px] text-[#a8754a] mt-2 leading-relaxed">※ {DISCLAIMER_COST}</p>
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

/**
 * 建築計画の簡易チェック（仕様§7.7）。
 * 居室判定や正確な近接判定は省き、ざっくりとした注意喚起のみ。
 */
function ArchitecturalHints({
  rooms, windows,
}: {
  rooms: RoomShape[];
  windows: WindowShape[];
}) {
  const hints: string[] = [];

  // 居室相当（LDK / 主寝室 / 子供部屋 / 和室 / 書斎）に窓が1つも無い
  const livingKinds = ["LDK", "主寝室", "子供部屋", "和室", "書斎"];
  const livingRooms = rooms.filter((r) =>
    livingKinds.includes(r.type ?? r.label)
  );
  if (livingRooms.length > 0 && windows.length === 0) {
    hints.push(
      "居室に窓が配置されていません。建築基準法では居室の採光に有効な開口が床面積の1/7以上必要です。"
    );
  }

  // 小さすぎる居室
  const tiny = livingRooms.filter((r) => cellsToJou(r.w, r.h) < 4.5);
  if (tiny.length > 0) {
    hints.push(
      `${tiny.map((r) => r.label).join("・")} が 4.5帖 未満です。家具配置に余裕があるか再確認してみましょう。`
    );
  }

  // 浴室サイズ
  const baths = rooms.filter((r) => (r.type ?? r.label) === "浴室");
  for (const b of baths) {
    const tsubo = cellsToJou(b.w, b.h) / 2;
    if (tsubo < 0.75) {
      hints.push("浴室が 0.75坪 未満です（一般的なユニットバスの最小サイズは0.75坪）。");
    }
  }

  if (hints.length === 0) return null;

  return (
    <div className="mx-4 mt-3 bg-sage-soft border border-[#d6ddc7] rounded-[13px] px-3.5 py-3">
      <div className="text-[10.5px] font-bold tracking-wider text-[#5d6b40] mb-1">
        ⚠ 建築計画ヒント（参考）
      </div>
      <ul className="text-[12px] text-[#46532f] leading-relaxed space-y-1 list-disc pl-4">
        {hints.map((h, i) => (<li key={i}>{h}</li>))}
      </ul>
      <p className="text-[10px] text-ink-faint mt-2">
        ※ 法適合判定は有資格者・自治体に最終確認してください
      </p>
    </div>
  );
}

const FIXTURE_DEFAULTS: Record<FixtureShape["kind"], { w: number; h: number }> = {
  "kitchen-i": { w: 5, h: 1 },
  "kitchen-l": { w: 4, h: 3 },
  "kitchen-island": { w: 4, h: 2 },
  bath: { w: 2, h: 3 },
  washbasin: { w: 2, h: 1 },
  toilet: { w: 1, h: 2 },
  stairs: { w: 2, h: 4 },
  closet: { w: 2, h: 1 },
  entrance: { w: 2, h: 2 },
};

const DOOR_LABELS: Record<DoorShape["kind"], string> = {
  hinged: "開き戸",
  sliding: "引き戸",
  folding: "折れ戸",
};

const FIXTURE_LABELS: Record<FixtureShape["kind"], string> = {
  "kitchen-i": "I型キッチン",
  "kitchen-l": "L型キッチン",
  "kitchen-island": "アイランドキッチン",
  bath: "浴槽",
  washbasin: "洗面",
  toilet: "トイレ",
  stairs: "階段",
  closet: "収納",
  entrance: "玄関土間",
};
