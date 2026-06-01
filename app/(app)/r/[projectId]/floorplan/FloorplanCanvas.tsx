"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Stage,
  Layer,
  Line,
  Rect,
  Text,
  Group,
  Arc,
  Transformer,
  Arrow,
} from "react-konva";
import type Konva from "konva";
import {
  cellsToJou,
  type FloorplanData,
  type RoomShape,
  type DoorShape,
  type WindowShape,
  type FixtureShape,
} from "@/lib/floorplan";

const CELL_PX = 30;
const HALF = CELL_PX / 2;
const COLS = 26;
const ROWS = 26;
const STAGE_W = CELL_PX * COLS;
const STAGE_H = CELL_PX * ROWS;
const WALL = "#9c907c";
const GRID = "#e9e0d0";
const CLAY = "#bd5d3a";
const PAPER = "#f8f3ec";

export type Selection =
  | { type: "room"; id: string }
  | { type: "door"; id: string }
  | { type: "window"; id: string }
  | { type: "fixture"; id: string }
  | null;

export type CanvasHandle = {
  toDataURL: () => string | null;
  getViewportWidth: () => number;
};

const FloorplanCanvas = forwardRef<
  CanvasHandle,
  {
    data: FloorplanData;
    selected: Selection;
    zoom: number;
    onSelect: (sel: Selection) => void;
    onRoomChange: (id: string, patch: Partial<RoomShape>) => void;
    onDoorChange: (id: string, patch: Partial<DoorShape>) => void;
    onWindowChange: (id: string, patch: Partial<WindowShape>) => void;
    onFixtureChange: (id: string, patch: Partial<FixtureShape>) => void;
  }
>(function FloorplanCanvas(
  {
    data,
    selected,
    zoom,
    onSelect,
    onRoomChange,
    onDoorChange,
    onWindowChange,
    onFixtureChange,
  },
  ref
) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    toDataURL: () => {
      const stage = stageRef.current;
      if (!stage) return null;
      // PNG 出力は等倍で。表示中のズームに左右されないよう一時的に scale=1 に戻す
      const oldScale = stage.scaleX();
      stage.scale({ x: 1, y: 1 });
      stage.width(STAGE_W);
      stage.height(STAGE_H);
      const url = stage.toDataURL({
        pixelRatio: 2,
        mimeType: "image/png",
        x: 0,
        y: 0,
        width: STAGE_W,
        height: STAGE_H,
      });
      stage.scale({ x: oldScale, y: oldScale });
      stage.width(STAGE_W * oldScale);
      stage.height(STAGE_H * oldScale);
      return url;
    },
    getViewportWidth: () => containerRef.current?.clientWidth ?? 0,
  }));

  return (
    <div
      ref={containerRef}
      className="overflow-auto bg-[#f8f3ec] border-y border-line touch-pan-x touch-pan-y"
      style={{ maxHeight: "min(60vh, 560px)", minHeight: 320 }}
    >
      <Stage
        ref={stageRef}
        width={STAGE_W * zoom}
        height={STAGE_H * zoom}
        scaleX={zoom}
        scaleY={zoom}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onSelect(null);
        }}
        onTouchStart={(e) => {
          if (e.target === e.target.getStage()) onSelect(null);
        }}
      >
        <Layer listening={false}>
          {Array.from({ length: COLS + 1 }).map((_, i) => (
            <Line
              key={`v${i}`}
              points={[i * CELL_PX, 0, i * CELL_PX, STAGE_H]}
              stroke={GRID}
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: ROWS + 1 }).map((_, i) => (
            <Line
              key={`h${i}`}
              points={[0, i * CELL_PX, STAGE_W, i * CELL_PX]}
              stroke={GRID}
              strokeWidth={1}
            />
          ))}
          <Rect
            x={0}
            y={0}
            width={STAGE_W}
            height={STAGE_H}
            stroke={WALL}
            strokeWidth={2}
            listening={false}
          />
        </Layer>

        <Layer>
          {data.rooms.map((room) => (
            <RoomNode
              key={room.id}
              room={room}
              selected={
                selected?.type === "room" && selected.id === room.id
              }
              onSelect={() => onSelect({ type: "room", id: room.id })}
              onChange={(p) => onRoomChange(room.id, p)}
            />
          ))}

          {data.fixtures.map((fx) => (
            <FixtureNode
              key={fx.id}
              fx={fx}
              selected={
                selected?.type === "fixture" && selected.id === fx.id
              }
              onSelect={() => onSelect({ type: "fixture", id: fx.id })}
              onChange={(p) => onFixtureChange(fx.id, p)}
            />
          ))}
        </Layer>

        {/* 建具・窓はトップレイヤ（壁の上に描く） */}
        <Layer>
          {data.doors.map((d) => (
            <DoorNode
              key={d.id}
              door={d}
              selected={selected?.type === "door" && selected.id === d.id}
              onSelect={() => onSelect({ type: "door", id: d.id })}
              onChange={(p) => onDoorChange(d.id, p)}
            />
          ))}
          {data.windows.map((w) => (
            <WindowNode
              key={w.id}
              win={w}
              selected={selected?.type === "window" && selected.id === w.id}
              onSelect={() => onSelect({ type: "window", id: w.id })}
              onChange={(p) => onWindowChange(w.id, p)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
});

export default FloorplanCanvas;

// =========================================================
// 部屋
// =========================================================
function RoomNode({
  room,
  selected,
  onSelect,
  onChange,
}: {
  room: RoomShape;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<RoomShape>) => void;
}) {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (selected && groupRef.current && trRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    } else if (!selected && trRef.current) {
      trRef.current.nodes([]);
    }
  }, [selected]);

  const W = room.w * CELL_PX;
  const H = room.h * CELL_PX;

  return (
    <>
      <Group
        ref={groupRef}
        x={room.x * CELL_PX}
        y={room.y * CELL_PX}
        draggable
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onDragMove={(e) => {
          const node = e.target;
          const nx = Math.max(0, Math.min((COLS - room.w) * CELL_PX, snapToCell(node.x())));
          const ny = Math.max(0, Math.min((ROWS - room.h) * CELL_PX, snapToCell(node.y())));
          node.position({ x: nx, y: ny });
        }}
        onDragEnd={(e) => {
          const node = e.target;
          onChange({
            x: Math.round(node.x() / CELL_PX),
            y: Math.round(node.y() / CELL_PX),
          });
        }}
        onTransformEnd={() => {
          const node = groupRef.current;
          if (!node) return;
          const sX = node.scaleX();
          const sY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          const newW = Math.max(1, Math.round(room.w * sX));
          const newH = Math.max(1, Math.round(room.h * sY));
          const nx = Math.round(node.x() / CELL_PX);
          const ny = Math.round(node.y() / CELL_PX);
          onChange({
            x: Math.max(0, Math.min(COLS - newW, nx)),
            y: Math.max(0, Math.min(ROWS - newH, ny)),
            w: Math.min(COLS, newW),
            h: Math.min(ROWS, newH),
          });
        }}
      >
        <Rect
          width={W}
          height={H}
          fill="#fffdf9"
          stroke={selected ? CLAY : WALL}
          strokeWidth={selected ? 2 : 1.5}
        />
        {selected && (
          <Rect
            x={2}
            y={2}
            width={W - 4}
            height={H - 4}
            stroke="#f3e2d9"
            strokeWidth={2}
            listening={false}
          />
        )}
        <Text
          width={W}
          height={H}
          text={`${room.label}\n${cellsToJou(room.w, room.h)}帖`}
          align="center"
          verticalAlign="middle"
          fontFamily="serif"
          fontSize={13}
          fontStyle="600"
          fill="#2c2722"
          listening={false}
        />
      </Group>
      {selected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          keepRatio={false}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "middle-left",
            "middle-right",
            "top-center",
            "bottom-center",
          ]}
          anchorSize={16}
          anchorStroke={CLAY}
          anchorFill="#ffffff"
          borderStroke={CLAY}
          borderDash={[4, 4]}
          boundBoxFunc={(_o, n) => {
            if (n.width < CELL_PX) n.width = CELL_PX;
            if (n.height < CELL_PX) n.height = CELL_PX;
            return n;
          }}
        />
      )}
    </>
  );
}

// =========================================================
// 建具：開き戸 / 引き戸 / 折れ戸
// =========================================================
function DoorNode({
  door,
  selected,
  onSelect,
  onChange,
}: {
  door: DoorShape;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<DoorShape>) => void;
}) {
  const W = door.w * CELL_PX;
  const H = door.h * CELL_PX;

  return (
    <Group
      x={door.x * HALF}
      y={door.y * HALF}
      rotation={door.rot}
      offsetX={W / 2}
      offsetY={H / 2}
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onDragMove={(e) => {
        const node = e.target;
        node.position({
          x: snapToHalf(node.x()),
          y: snapToHalf(node.y()),
        });
      }}
      onDragEnd={(e) => {
        const node = e.target;
        onChange({
          x: Math.round(node.x() / HALF),
          y: Math.round(node.y() / HALF),
        });
      }}
    >
      {door.kind === "hinged" ? (
        <HingedDoorGlyph w={W} h={H} swing={door.swing ?? "left"} />
      ) : door.kind === "sliding" ? (
        <SlidingDoorGlyph w={W} h={H} />
      ) : (
        <FoldingDoorGlyph w={W} h={H} />
      )}
      {selected && (
        <Rect
          width={W}
          height={H}
          stroke={CLAY}
          strokeWidth={2}
          dash={[4, 4]}
          listening={false}
        />
      )}
    </Group>
  );
}

function HingedDoorGlyph({
  w,
  h,
  swing,
}: {
  w: number;
  h: number;
  swing: "left" | "right";
}) {
  // 開口部 (opening) を白く塗って壁を切る + 開き軌跡の1/4円 + 扉のライン
  const hingeX = swing === "left" ? 0 : w;
  return (
    <>
      <Rect width={w} height={h} fill={PAPER} stroke={WALL} strokeWidth={1} />
      <Arc
        x={hingeX}
        y={h}
        innerRadius={0}
        outerRadius={Math.min(w, h * 2)}
        angle={90}
        rotation={swing === "left" ? -90 : -180}
        stroke="#2c2722"
        strokeWidth={1}
      />
      <Line
        points={
          swing === "left"
            ? [0, h, 0, h - Math.min(w, h * 2)]
            : [w, h, w, h - Math.min(w, h * 2)]
        }
        stroke="#2c2722"
        strokeWidth={2}
      />
    </>
  );
}

function SlidingDoorGlyph({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect width={w} height={h} fill={PAPER} stroke={WALL} strokeWidth={1} />
      <Line points={[0, h / 2, w, h / 2]} stroke={WALL} dash={[3, 3]} strokeWidth={1} />
      <Arrow
        points={[w * 0.3, h * 0.25, w * 0.7, h * 0.25]}
        stroke="#2c2722"
        fill="#2c2722"
        strokeWidth={1}
        pointerLength={4}
        pointerWidth={4}
      />
      <Arrow
        points={[w * 0.7, h * 0.75, w * 0.3, h * 0.75]}
        stroke="#2c2722"
        fill="#2c2722"
        strokeWidth={1}
        pointerLength={4}
        pointerWidth={4}
      />
    </>
  );
}

function FoldingDoorGlyph({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect width={w} height={h} fill={PAPER} stroke={WALL} strokeWidth={1} />
      <Line
        points={[0, h, w / 2, 0, w, h]}
        stroke="#2c2722"
        strokeWidth={1.5}
      />
    </>
  );
}

// =========================================================
// 窓
// =========================================================
function WindowNode({
  win,
  selected,
  onSelect,
  onChange,
}: {
  win: WindowShape;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<WindowShape>) => void;
}) {
  const W = win.w * CELL_PX;
  const H = win.h * CELL_PX;

  return (
    <Group
      x={win.x * HALF}
      y={win.y * HALF}
      rotation={win.rot}
      offsetX={W / 2}
      offsetY={H / 2}
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onDragMove={(e) => {
        const node = e.target;
        node.position({
          x: snapToHalf(node.x()),
          y: snapToHalf(node.y()),
        });
      }}
      onDragEnd={(e) => {
        const node = e.target;
        onChange({
          x: Math.round(node.x() / HALF),
          y: Math.round(node.y() / HALF),
        });
      }}
    >
      <Rect width={W} height={H} fill={PAPER} stroke={WALL} strokeWidth={1} />
      <Line points={[0, H / 2, W, H / 2]} stroke={WALL} strokeWidth={1} />
      {selected && (
        <Rect
          width={W}
          height={H}
          stroke={CLAY}
          strokeWidth={2}
          dash={[4, 4]}
          listening={false}
        />
      )}
    </Group>
  );
}

// =========================================================
// 設備スタンプ
// =========================================================
function FixtureNode({
  fx,
  selected,
  onSelect,
  onChange,
}: {
  fx: FixtureShape;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<FixtureShape>) => void;
}) {
  const W = fx.w * CELL_PX;
  const H = fx.h * CELL_PX;
  const meta = FIXTURE_META[fx.kind] ?? {
    label: fx.kind,
    fill: "#f3eadc",
    icon: "▦",
  };

  return (
    <Group
      x={fx.x * HALF}
      y={fx.y * HALF}
      rotation={fx.rot}
      offsetX={W / 2}
      offsetY={H / 2}
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onDragMove={(e) => {
        const node = e.target;
        node.position({
          x: snapToHalf(node.x()),
          y: snapToHalf(node.y()),
        });
      }}
      onDragEnd={(e) => {
        const node = e.target;
        onChange({
          x: Math.round(node.x() / HALF),
          y: Math.round(node.y() / HALF),
        });
      }}
    >
      <Rect
        width={W}
        height={H}
        fill={meta.fill}
        stroke="#8a7e6b"
        strokeWidth={1}
        cornerRadius={fx.kind === "bath" ? 8 : 2}
      />
      {/* キッチンの簡易シンク・コンロ */}
      {fx.kind === "kitchen-i" && (
        <>
          <Rect
            x={W * 0.1}
            y={H * 0.2}
            width={W * 0.3}
            height={H * 0.6}
            fill="#fff"
            stroke="#8a7e6b"
            strokeWidth={1}
            cornerRadius={2}
          />
          <Line
            points={[W * 0.7, H * 0.3, W * 0.7, H * 0.7]}
            stroke="#8a7e6b"
            strokeWidth={1}
          />
        </>
      )}
      {/* トイレの便座 */}
      {fx.kind === "toilet" && (
        <Rect
          x={W * 0.2}
          y={H * 0.35}
          width={W * 0.6}
          height={H * 0.5}
          fill="#fff"
          stroke="#8a7e6b"
          cornerRadius={W * 0.3}
        />
      )}
      {/* 階段のステップライン */}
      {fx.kind === "stairs" &&
        Array.from({ length: Math.max(3, Math.floor(H / 8)) }).map((_, i, arr) => (
          <Line
            key={i}
            points={[0, ((i + 1) / arr.length) * H, W, ((i + 1) / arr.length) * H]}
            stroke="#8a7e6b"
            strokeWidth={0.5}
          />
        ))}
      <Text
        width={W}
        height={H}
        text={`${meta.icon}\n${meta.label}`}
        align="center"
        verticalAlign="middle"
        fontFamily="sans-serif"
        fontSize={10}
        fill="#5d5247"
        listening={false}
      />
      {selected && (
        <Rect
          width={W}
          height={H}
          stroke={CLAY}
          strokeWidth={2}
          dash={[4, 4]}
          listening={false}
        />
      )}
    </Group>
  );
}

const FIXTURE_META: Record<
  string,
  { label: string; fill: string; icon: string }
> = {
  "kitchen-i": { label: "キッチン", fill: "#fdf3e2", icon: "🍳" },
  "kitchen-l": { label: "L型キッチン", fill: "#fdf3e2", icon: "🍳" },
  "kitchen-island": { label: "アイランド", fill: "#fdf3e2", icon: "🍳" },
  bath: { label: "浴槽", fill: "#e2eef5", icon: "🛁" },
  washbasin: { label: "洗面", fill: "#eaf1f6", icon: "🚰" },
  toilet: { label: "トイレ", fill: "#f1ece4", icon: "🚽" },
  stairs: { label: "階段", fill: "#efe7d6", icon: "🪜" },
  closet: { label: "収納", fill: "#f0e9da", icon: "🗄" },
  entrance: { label: "玄関土間", fill: "#e9dfc8", icon: "👞" },
};

function snapToCell(v: number) {
  return Math.round(v / CELL_PX) * CELL_PX;
}

function snapToHalf(v: number) {
  return Math.round(v / HALF) * HALF;
}
