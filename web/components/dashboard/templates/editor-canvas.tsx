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
}

export default function EditorCanvas({
  canvas,
  blocks,
  selectedId,
  onSelect,
  onMove,
  onResize,
  onAddAt,
}: EditorCanvasProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [interacting, setInteracting] = useState<string | null>(null);

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
              {blocks.map((block) => (
                <BlockFrame
                  key={block.id}
                  block={block}
                  selected={block.id === selectedId}
                  scale={scale}
                  interacting={interacting === block.id}
                  onSelect={() => onSelect(block.id)}
                  onMove={onMove}
                  onResize={onResize}
                  onInteract={setInteracting}
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
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    orig: { x: number; y: number; width: number; height: number };
    dir: ResizeDir | "move";
    gestureScale: number;
  } | null>(null);

  function beginGesture(
    e: React.PointerEvent,
    dir: ResizeDir | "move",
    target: Element
  ) {
    e.stopPropagation();
    onSelect();
    target.setPointerCapture(e.pointerId);
    // frame rect reflects the stage transform; derive this gesture's scale
    const rect = frameRef.current?.getBoundingClientRect();
    const gestureScale = rect ? rect.width / Math.max(1, block.width) : scale;
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
      onMove(block.id, Math.round(orig.x + dx), Math.round(orig.y + dy));
      return;
    }
    let x = orig.x;
    let y = orig.y;
    let width = orig.width;
    let height = orig.height;
    if (dir.includes("e")) width = Math.max(MIN_SIZE, Math.round(orig.width + dx));
    if (dir.includes("s")) height = Math.max(MIN_SIZE, Math.round(orig.height + dy));
    if (dir.includes("w")) {
      width = Math.max(MIN_SIZE, Math.round(orig.width - dx));
      x = Math.round(orig.x + (orig.width - width));
    }
    if (dir.includes("n")) {
      height = Math.max(MIN_SIZE, Math.round(orig.height - dy));
      y = Math.round(orig.y + (orig.height - height));
    }
    onResize(block.id, { x, y, width, height });
  }

  function endGesture(e: React.PointerEvent) {
    if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return;
    dragRef.current = null;
    onInteract(null);
  }

  const inv = 1 / scale; // keeps handles/badges a constant visual size

  return (
    <div
      ref={frameRef}
      style={{
        position: "absolute",
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        cursor: "move",
        touchAction: "none",
        outline: selected ? `${1.5 * inv}px solid #3b82f6` : undefined,
        outlineOffset: 0,
      }}
      onPointerDown={(e) => beginGesture(e, "move", e.currentTarget)}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
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
