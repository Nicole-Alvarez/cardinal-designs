"use client";

import { useEffect, useRef, useState } from "react";
import {
  workingCanvasSize,
  type TemplateBlock,
  type TemplateCanvas,
} from "@/features/templates/types";
import BlockPreview from "./block-preview";
import CanvasStage from "./canvas-stage";

const MIN_SIZE = 16;
const PANE_PADDING = 32;
const SNAP_THRESHOLD = 6;

type ResizeDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface EditorCanvasProps {
  canvas: TemplateCanvas;
  blocks: TemplateBlock[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (
    id: string,
    patch: { x?: number; y?: number; width: number; height: number }
  ) => void;
  onAddAt: (x: number, y: number) => void;
  onDelete: (id: string) => void;
}

export default function EditorCanvas({
  canvas,
  blocks,
  selectedId,
  onSelect,
  onMove,
  onResize,
  onAddAt,
  onDelete,
}: EditorCanvasProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [interacting, setInteracting] = useState<string | null>(null);
  const [guides, setGuides] = useState<{ xs: number[]; ys: number[] }>({
    xs: [],
    ys: [],
  });

  const size = workingCanvasSize(canvas);
  const editorCanvas: TemplateCanvas = {
    ...canvas,
    width: `${size.width}px`,
    height: `${size.height}px`,
  };

  useEffect(() => {
    const el = paneRef.current;
    if (!el) return;
    const update = () => {
      const avail = el.clientWidth - PANE_PADDING * 2;
      setScale(Math.min(1, Math.max(0.1, avail / size.width)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [size.width]);

  function stagePoint(e: { clientX: number; clientY: number }): { x: number; y: number } {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const point = stagePoint(e);
    onAddAt(point.x, point.y);
  }

  function handleInteract(id: string | null) {
    setInteracting(id);
    if (id === null) setGuides({ xs: [], ys: [] });
  }

  function snapMove(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): { x: number; y: number } {
    const eps = SNAP_THRESHOLD / scale;
    const candX: number[] = [0, size.width / 2, size.width];
    const candY: number[] = [0, size.height / 2, size.height];
    for (const o of blocks) {
      if (o.id === id) continue;
      candX.push(o.x, o.x + o.width / 2, o.x + o.width);
      candY.push(o.y, o.y + o.height / 2, o.y + o.height);
    }
    const mineX = [x, x + width / 2, x + width];
    const mineY = [y, y + height / 2, y + height];

    let bx: { delta: number; at: number } | null = null;
    let by: { delta: number; at: number } | null = null;

    for (const c of candX) for (const m of mineX) {
      const d = c - m;
      if (Math.abs(d) <= eps && (!bx || Math.abs(d) < Math.abs(bx.delta))) {
        bx = { delta: d, at: c };
      }
    }
    for (const c of candY) for (const m of mineY) {
      const d = c - m;
      if (Math.abs(d) <= eps && (!by || Math.abs(d) < Math.abs(by.delta))) {
        by = { delta: d, at: c };
      }
    }

    setGuides({
      xs: bx ? [bx.at] : [],
      ys: by ? [by.at] : [],
    });
    return { x: x + (bx?.delta ?? 0), y: y + (by?.delta ?? 0) };
  }

  return (
    <div
      ref={paneRef}
      className="max-h-[70vh] overflow-auto rounded-2xl border bg-zinc-50 p-8 shadow-sm dark:bg-zinc-950/40"
    >
      <div className="mx-auto" style={{ width: size.width * scale }}>
        <div
          style={{
            width: size.width,
            height: size.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <CanvasStage canvas={editorCanvas}>
            <div
              ref={stageRef}
              className="absolute inset-0"
              onPointerDown={() => onSelect(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {[...blocks]
                .sort((a, b) => a.z - b.z)
                .map((block) => (
                  <BlockFrame
                    key={block.id}
                    block={block}
                    selected={block.id === selectedId}
                    scale={scale}
                    interacting={interacting === block.id}
                    onSelect={() => onSelect(block.id)}
                    onMove={onMove}
                    onResize={onResize}
                    onInteract={handleInteract}
                    onDelete={() => onDelete(block.id)}
                    snap={(x, y, width, height) =>
                      snapMove(block.id, x, y, width, height)
                    }
                  />
                ))}
              {guides.xs.map((v) => (
                <span
                  key={`vx${v}`}
                  className="pointer-events-none absolute z-10"
                  style={{
                    left: v,
                    top: 0,
                    width: 0,
                    height: "100%",
                    borderLeft: "1px dashed #3b82f6",
                  }}
                />
              ))}
              {guides.ys.map((h) => (
                <span
                  key={`hy${h}`}
                  className="pointer-events-none absolute z-10"
                  style={{
                    top: h,
                    left: 0,
                    height: 0,
                    width: "100%",
                    borderTop: "1px dashed #3b82f6",
                  }}
                />
              ))}
            </div>
          </CanvasStage>
        </div>
      </div>
    </div>
  );
}

function BlockFrame({
  block,
  selected,
  scale,
  interacting,
  onSelect,
  onMove,
  onResize,
  onInteract,
  onDelete,
  snap,
}: {
  block: TemplateBlock;
  selected: boolean;
  scale: number;
  interacting: boolean;
  onSelect: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (
    id: string,
    patch: { x?: number; y?: number; width: number; height: number }
  ) => void;
  onInteract: (id: string | null) => void;
  onDelete: () => void;
  snap?: (
    x: number,
    y: number,
    width: number,
    height: number
  ) => { x: number; y: number };
}) {
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    orig: { x: number; y: number; width: number; height: number };
    dir: ResizeDir | "move";
    gestureScale: number;
  } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  function beginGesture(
    e: React.PointerEvent,
    dir: ResizeDir | "move",
    target: Element
  ) {
    e.stopPropagation();
    onSelect();
    target.setPointerCapture(e.pointerId);
    const rect = frameRef.current?.getBoundingClientRect();
    const gestureScale =
      rect && rect.width > 0
        ? rect.width / Math.max(1, block.width)
        : scale || 1;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      orig: { x: block.x, y: block.y, width: block.width, height: block.height },
      dir,
      gestureScale,
    };
    onInteract(block.id);
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = (e.clientX - drag.startX) / drag.gestureScale;
    const dy = (e.clientY - drag.startY) / drag.gestureScale;
    const { orig, dir } = drag;

    if (dir === "move") {
      const raw = { x: Math.round(orig.x + dx), y: Math.round(orig.y + dy) };
      const snapped = snap
        ? snap(raw.x, raw.y, block.width, block.height)
        : raw;
      onMove(block.id, snapped.x, snapped.y);
      return;
    }
    let x = orig.x;
    let y = orig.y;
    let width = orig.width;
    let height = orig.height;
    if (dir.includes("e")) width = Math.max(MIN_SIZE, Math.round(orig.width + dx));
    if (dir.includes("s")) height = Math.max(MIN_SIZE, Math.round(orig.height + dy));
    if (dir.includes("w")) width = Math.max(MIN_SIZE, Math.round(orig.width - dx));
    if (dir.includes("n")) height = Math.max(MIN_SIZE, Math.round(orig.height - dy));
    // icon blocks are always square: the dominant axis wins
    if (block.type === "icon") {
      const size = Math.max(width, height);
      width = size;
      height = size;
    }
    if (dir.includes("w")) x = Math.round(orig.x + (orig.width - width));
    if (dir.includes("n")) y = Math.round(orig.y + (orig.height - height));
    onResize(block.id, { x, y, width, height });
  }

  function endGesture(e: React.PointerEvent) {
    if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return;
    dragRef.current = null;
    onInteract(null);
  }

  const inv = 1 / scale;

  return (
    <div
      ref={frameRef}
      style={{
        position: "absolute",
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        zIndex: block.z,
        cursor: "move",
        touchAction: "none",
        userSelect: "none",
        outline: selected ? `${1.5 * inv}px solid #3b82f6` : undefined,
        outlineOffset: 0,
      }}
      onPointerDown={(e) => beginGesture(e, "move", e.currentTarget)}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onDragStart={(e) => e.preventDefault()}
    >
      <BlockPreview block={block} />

      {selected && (
        <>
          {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as ResizeDir[]).map((dir) => (
            <HandleDot
              key={dir}
              dir={dir}
              inv={inv}
              onPointerDown={(e) => beginGesture(e, dir, e.currentTarget)}
              onPointerMove={onPointerMove}
              onPointerUp={endGesture}
              onPointerCancel={endGesture}
            />
          ))}
          <button
            type="button"
            aria-label="Delete block"
            title="Delete block"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute grid cursor-pointer place-items-center rounded-full bg-zinc-900 font-medium leading-none text-white transition-colors hover:bg-red-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-red-500"
            style={{
              top: -8 * inv,
              right: -8 * inv,
              width: 16 * inv,
              height: 16 * inv,
              fontSize: 10 * inv,
              border: `${1 * inv}px solid #ffffff`,
              zIndex: 11,
            }}
          >
            ×
          </button>
          {interacting && (
            <span
              className="pointer-events-none absolute whitespace-nowrap rounded bg-blue-500 px-1 font-mono text-white"
              style={{
                left: 0,
                top: -18 * inv,
                fontSize: 10 * inv,
                lineHeight: `${16 * inv}px`,
                paddingInline: 3 * inv,
              }}
            >
              {Math.round(block.x)}, {Math.round(block.y)} · {Math.round(block.width)}×
              {Math.round(block.height)}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function HandleDot({
  dir,
  inv,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  dir: ResizeDir;
  inv: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
}) {
  const hs = 8 * inv;
  const offset = -hs / 2;
  const pos: React.CSSProperties = { position: "absolute", width: hs, height: hs };
  if (dir.includes("n")) pos.top = offset;
  if (dir.includes("s")) pos.bottom = offset;
  if (dir.includes("w")) pos.left = offset;
  if (dir.includes("e")) pos.right = offset;
  if (dir === "n" || dir === "s") {
    pos.left = "50%";
    pos.marginLeft = offset;
  }
  if (dir === "e" || dir === "w") {
    pos.top = "50%";
    pos.marginTop = offset;
  }
  const cursor: Record<ResizeDir, string> = {
    nw: "nwse-resize",
    n: "ns-resize",
    ne: "nesw-resize",
    e: "ew-resize",
    se: "nwse-resize",
    s: "ns-resize",
    sw: "nesw-resize",
    w: "ew-resize",
  };

  return (
    <span
      style={{
        ...pos,
        backgroundColor: "#ffffff",
        border: `${1.5 * inv}px solid #3b82f6`,
        borderRadius: 2 * inv,
        cursor: cursor[dir],
        touchAction: "none",
        zIndex: 10,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    />
  );
}
