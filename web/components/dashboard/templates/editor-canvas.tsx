"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

interface SpacingGuide {
  dir: "up" | "down" | "left" | "right";
  dist: number;
  x?: number;
  y?: number;
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
}

interface PaddingOverlay {
  x: number;
  y: number;
  w: number;
  h: number;
  pad: number;
}

interface GapOverlay {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

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
  showSpacing?: boolean;
  showGrid?: boolean;
  gridSize?: number;
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
  showSpacing = false,
  showGrid = false,
  gridSize = 8,
}: EditorCanvasProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [interacting, setInteracting] = useState<string | null>(null);
  const [guides, setGuides] = useState<{ xs: number[]; ys: number[] }>({
    xs: [],
    ys: [],
  });
  const [dragBlock, setDragBlock] = useState<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

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

  const dragGuides = useMemo<SpacingGuide[]>(() => {
    if (!dragBlock || !showSpacing) return [];
    return computeDragSpacingGuides(dragBlock.id, dragBlock.x, dragBlock.y, dragBlock.w, dragBlock.h);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute when drag position or spacing toggle changes
  }, [dragBlock, showSpacing, blocks]);

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
    if (id === null) {
      setGuides({ xs: [], ys: [] });
      setDragBlock(null);
    }
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
    if (showGrid && gridSize > 0) {
      const startX = Math.floor(x / gridSize) * gridSize;
      const startY = Math.floor(y / gridSize) * gridSize;
      for (let gx = startX; gx <= x + width; gx += gridSize) candX.push(gx);
      for (let gy = startY; gy <= y + height; gy += gridSize) candY.push(gy);
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

  function computeDragSpacingGuides(
    id: string,
    nx: number,
    ny: number,
    w: number,
    h: number
  ): SpacingGuide[] {
    const MAX_DIST = 150;
    const result: SpacingGuide[] = [];
    const right = nx + w;
    const bottom = ny + h;

    let bestUp: { dist: number; y: number } | null = null;
    let bestDown: { dist: number; y: number } | null = null;
    let bestLeft: { dist: number; x: number } | null = null;
    let bestRight: { dist: number; x: number } | null = null;

    const edges = [
      { x: 0, y: 0, w: size.width, h: 0 },
      ...blocks.filter((b) => b.id !== id).map((b) => ({ x: b.x, y: b.y, w: b.width, h: b.height })),
    ];
    for (const e of edges) {
      const eRight = e.x + e.w;
      const eBottom = e.y + e.h;

      if (eRight <= nx) {
        const dist = nx - eRight;
        if (dist <= MAX_DIST && (!bestLeft || dist < bestLeft.dist)) {
          bestLeft = { dist, x: (eRight + nx) / 2 };
        }
      }
      if (e.x >= right) {
        const dist = e.x - right;
        if (dist <= MAX_DIST && (!bestRight || dist < bestRight.dist)) {
          bestRight = { dist, x: (right + e.x) / 2 };
        }
      }
      if (eBottom <= ny) {
        const dist = ny - eBottom;
        if (dist <= MAX_DIST && (!bestUp || dist < bestUp.dist)) {
          bestUp = { dist, y: (eBottom + ny) / 2 };
        }
      }
      if (e.y >= bottom) {
        const dist = e.y - bottom;
        if (dist <= MAX_DIST && (!bestDown || dist < bestDown.dist)) {
          bestDown = { dist, y: (bottom + e.y) / 2 };
        }
      }
    }

    if (bestLeft) {
      result.push({ dir: "left", dist: bestLeft.dist, x: bestLeft.x, y1: ny, y2: bottom });
    }
    if (bestRight) {
      result.push({ dir: "right", dist: bestRight.dist, x: bestRight.x, y1: ny, y2: bottom });
    }
    if (bestUp) {
      result.push({ dir: "up", dist: bestUp.dist, y: bestUp.y, x1: nx, x2: right });
    }
    if (bestDown) {
      result.push({ dir: "down", dist: bestDown.dist, y: bestDown.y, x1: nx, x2: right });
    }

    return result;
  }

  function computeSpacingOverlays(): { padding: PaddingOverlay[]; gaps: GapOverlay[] } {
    const padding: PaddingOverlay[] = [];
    const gaps: GapOverlay[] = [];

    for (const b of blocks) {
      const p = b.style.padding;
      if (p > 0) {
        padding.push({ x: b.x, y: b.y, w: b.width, h: b.height, pad: p });
      }
    }

    const GAP_MAX = 150;
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const a = blocks[i];
        const b = blocks[j];
        const aR = a.x + a.width;
        const aB = a.y + a.height;
        const bR = b.x + b.width;
        const bB = b.y + b.height;

        const overlapX = Math.max(0, Math.min(aR, bR) - Math.max(a.x, b.x));
        const overlapY = Math.max(0, Math.min(aB, bB) - Math.max(a.y, b.y));

        if (overlapY > 0) {
          const gapLeft = b.x - aR;
          const gapRight = a.x - bR;
          if (gapLeft > 0 && gapLeft <= GAP_MAX) {
            gaps.push({
              x: aR, y: Math.max(a.y, b.y),
              w: gapLeft, h: overlapY,
              label: `${Math.round(gapLeft)}px`,
            });
          } else if (gapRight > 0 && gapRight <= GAP_MAX) {
            gaps.push({
              x: bR, y: Math.max(a.y, b.y),
              w: gapRight, h: overlapY,
              label: `${Math.round(gapRight)}px`,
            });
          }
        }

        if (overlapX > 0) {
          const gapTop = b.y - aB;
          const gapBottom = a.y - bB;
          if (gapTop > 0 && gapTop <= GAP_MAX) {
            gaps.push({
              x: Math.max(a.x, b.x), y: aB,
              w: overlapX, h: gapTop,
              label: `${Math.round(gapTop)}px`,
            });
          } else if (gapBottom > 0 && gapBottom <= GAP_MAX) {
            gaps.push({
              x: Math.max(a.x, b.x), y: bB,
              w: overlapX, h: gapBottom,
              label: `${Math.round(gapBottom)}px`,
            });
          }
        }
      }
    }

    return { padding, gaps };
  }

  const spacingOverlays = showSpacing ? computeSpacingOverlays() : null;

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
          <CanvasStage canvas={editorCanvas} showGrid={showGrid} gridSize={gridSize}>
            <div
              ref={stageRef}
              className="absolute inset-0"
              onPointerDown={() => onSelect(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {spacingOverlays?.padding.map((p, i) => (
                <span
                  key={`pad${i}`}
                  className="pointer-events-none absolute z-[1]"
                  style={{
                    left: p.x + p.pad,
                    top: p.y + p.pad,
                    width: Math.max(0, p.w - p.pad * 2),
                    height: Math.max(0, p.h - p.pad * 2),
                    backgroundColor: "rgba(59,130,246,0.12)",
                    border: "1px dashed rgba(59,130,246,0.4)",
                  }}
                />
              ))}
              {spacingOverlays?.gaps.map((g, i) => (
                <span
                  key={`gap${i}`}
                  className="pointer-events-none absolute z-[1] flex items-center justify-center"
                  style={{
                    left: g.x,
                    top: g.y,
                    width: g.w,
                    height: g.h,
                    backgroundColor: "rgba(249,115,22,0.15)",
                  }}
                >
                  <span
                    className="whitespace-nowrap rounded bg-orange-500 px-1 font-mono text-white"
                    style={{ fontSize: 10, lineHeight: "14px" }}
                  >
                    {g.label}
                  </span>
                </span>
              ))}
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
                    onDragPosition={(x, y, w, h) =>
                      setDragBlock({ id: block.id, x, y, w, h })
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
              {showSpacing && dragGuides.map((g, i) => {
                const inv = 1 / scale;
                if (g.dir === "left" || g.dir === "right") {
                  return (
                    <span
                      key={`sg${i}`}
                      className="pointer-events-none absolute z-20 flex flex-col items-center justify-center"
                      style={{
                        left: g.x! - 1,
                        top: g.y1!,
                        width: 2,
                        height: g.y2! - g.y1!,
                      }}
                    >
                      <span
                        className="absolute"
                        style={{
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: g.dist,
                          height: 0,
                          borderTop: "1px solid #3b82f6",
                        }}
                      />
                      <span
                        className="absolute whitespace-nowrap rounded bg-blue-500 px-1 font-mono text-white"
                        style={{
                          top: "50%",
                          left: g.dist / 2,
                          transform: "translate(-50%, -50%)",
                          fontSize: 10 * inv,
                          lineHeight: `${14 * inv}px`,
                          paddingInline: 3 * inv,
                        }}
                      >
                        {Math.round(g.dist)}px
                      </span>
                    </span>
                  );
                }
                return (
                  <span
                    key={`sg${i}`}
                    className="pointer-events-none absolute z-20 flex items-center justify-center"
                    style={{
                      top: g.y! - 1,
                      left: g.x1!,
                      height: 2,
                      width: g.x2! - g.x1!,
                    }}
                  >
                    <span
                      className="absolute"
                      style={{
                        left: "50%",
                        transform: "translateX(-50%)",
                        height: g.dist,
                        width: 0,
                        borderLeft: "1px solid #3b82f6",
                      }}
                    />
                    <span
                      className="absolute whitespace-nowrap rounded bg-blue-500 px-1 font-mono text-white"
                      style={{
                        left: "50%",
                        top: g.dist / 2,
                        transform: "translate(-50%, -50%)",
                        fontSize: 10 * inv,
                        lineHeight: `${14 * inv}px`,
                        paddingInline: 3 * inv,
                      }}
                    >
                      {Math.round(g.dist)}px
                    </span>
                  </span>
                );
              })}
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
  onDragPosition,
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
  onDragPosition?: (x: number, y: number, w: number, h: number) => void;
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
      onDragPosition?.(snapped.x, snapped.y, block.width, block.height);
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
