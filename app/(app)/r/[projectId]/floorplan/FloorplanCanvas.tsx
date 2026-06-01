"use client";

import { useEffect, useRef } from "react";
import { Stage, Layer, Line, Rect, Text, Group, Transformer } from "react-konva";
import type Konva from "konva";
import { cellsToJou, type FloorplanData, type RoomShape } from "@/lib/floorplan";

/**
 * 1セル = 半間 = 910mm を画面上では CELL_PX として扱う。
 * COLS × ROWS で 26マス（約23.7m）四方の編集領域を用意。
 */
const CELL_PX = 30;
const COLS = 26;
const ROWS = 26;
const STAGE_W = CELL_PX * COLS;
const STAGE_H = CELL_PX * ROWS;
const WALL = "#9c907c";
const GRID = "#e9e0d0";
const CLAY = "#bd5d3a";

export default function FloorplanCanvas({
  data,
  selectedId,
  onSelect,
  onRoomChange,
}: {
  data: FloorplanData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRoomChange: (id: string, patch: Partial<RoomShape>) => void;
}) {
  return (
    <div className="overflow-auto bg-[#f8f3ec] border-y border-line touch-pan-x touch-pan-y">
      <Stage
        width={STAGE_W}
        height={STAGE_H}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onSelect(null);
        }}
        onTouchStart={(e) => {
          if (e.target === e.target.getStage()) onSelect(null);
        }}
      >
        {/* グリッド */}
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
          {/* 外枠（壁色） */}
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

        {/* 部屋 */}
        <Layer>
          {data.rooms.map((room) => (
            <RoomNode
              key={room.id}
              room={room}
              selected={selectedId === room.id}
              onSelect={() => onSelect(room.id)}
              onChange={(patch) => onRoomChange(room.id, patch)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

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

  // 選択中は Transformer をアタッチ
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
          // ドラッグ中もグリッドにスナップ
          const node = e.target;
          const nx = Math.max(
            0,
            Math.min((COLS - room.w) * CELL_PX, snapToCell(node.x()))
          );
          const ny = Math.max(
            0,
            Math.min((ROWS - room.h) * CELL_PX, snapToCell(node.y()))
          );
          node.position({ x: nx, y: ny });
        }}
        onDragEnd={(e) => {
          const node = e.target;
          const nx = Math.round(node.x() / CELL_PX);
          const ny = Math.round(node.y() / CELL_PX);
          onChange({ x: nx, y: ny });
        }}
        onTransformEnd={() => {
          // セル単位で丸める
          const node = groupRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          const newW = Math.max(1, Math.round(room.w * scaleX));
          const newH = Math.max(1, Math.round(room.h * scaleY));
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
          // セル単位スナップを意識した最小サイズ
          boundBoxFunc={(_oldBox, newBox) => {
            if (newBox.width < CELL_PX) newBox.width = CELL_PX;
            if (newBox.height < CELL_PX) newBox.height = CELL_PX;
            return newBox;
          }}
        />
      )}
    </>
  );
}

function snapToCell(v: number) {
  return Math.round(v / CELL_PX) * CELL_PX;
}
