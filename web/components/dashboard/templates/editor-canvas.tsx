"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  canvasGuidePalette,
  type CanvasGuidePalette,
} from "@/features/templates/canvas-guides";
import {
  CARDINAL_BLOCK_MIME,
  CARDINAL_NEW_BLOCK_PAYLOAD,
} from "@/features/templates/drag-types";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  clampCanvasPan,
  clampZoom,
  fitCanvasZoom,
  stepZoom,
  zoomPanOffset,
} from "@/features/templates/canvas-viewport";
import {
  isSquareBlock,
  workingCanvasSize,
  type TemplateBlock,
  type TemplateCanvas,
} from "@/features/templates/types";
import BlockPreview from "./block-preview";
import CanvasStage from "./canvas-stage";
import { DraftNumberInput } from "./draft-inputs";
import { EditorIcon, EditorTooltip } from "./editor-controls";

const MIN_SIZE = 16;
const PANE_PADDING = 32;
const SNAP_THRESHOLD = 6;
const MIN_VISIBLE_CANVAS = 64;

type ResizeDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

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

interface DistanceMeasurement {
  key: string;
  orientation: "horizontal" | "vertical";
  x: number;
  y: number;
  length: number;
  value: number;
  referenceBlockId?: string;
}

interface EditorCanvasProps {
  canvas: TemplateCanvas;
  blocks: TemplateBlock[];
  selectedIds: string[];
  onSelect: (id: string | null, additive?: boolean) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (
    id: string,
    patch: { x?: number; y?: number; width: number; height: number }
  ) => void;
  onAddAt: (x: number, y: number) => void;
  onDelete: (id: string) => void;
  showSpacing?: boolean;
  onShowSpacingChange?: (show: boolean) => void;
  showGrid?: boolean;
  onShowGridChange?: (show: boolean) => void;
  gridSize?: number;
  onGridSizeChange?: (size: number) => void;
}

export default function EditorCanvas({
  canvas,
  blocks,
  selectedIds,
  onSelect,
  onMove,
  onResize,
  onAddAt,
  onDelete,
  showSpacing = false,
  onShowSpacingChange,
  showGrid = false,
  onShowGridChange,
  gridSize = 8,
  onGridSizeChange,
}: EditorCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const [viewMode, setViewMode] = useState<"fit" | "manual">("fit");
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
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
  const guidePalette = canvasGuidePalette(canvas.backgroundColor, canvas.textColor);
  const editorCanvas: TemplateCanvas = {
    ...canvas,
    width: `${size.width}px`,
    height: `${size.height}px`,
  };

  const canvasViewportOrigin = useCallback(
    (
      viewport: HTMLDivElement,
      scaleValue = scaleRef.current,
      scroll = { left: viewport.scrollLeft, top: viewport.scrollTop }
    ) => {
      const scaledCanvas = {
        width: size.width * scaleValue,
        height: size.height * scaleValue,
      };
      const viewportContentWidth = Math.max(
        0,
        viewport.clientWidth - PANE_PADDING * 2
      );
      return {
        x:
          PANE_PADDING +
          Math.max(0, (viewportContentWidth - scaledCanvas.width) / 2) -
          scroll.left,
        y: PANE_PADDING - scroll.top,
      };
    },
    [size.width, size.height]
  );

  const constrainPanOffset = useCallback(
    (
      offset: { x: number; y: number },
      viewport: HTMLDivElement,
      scaleValue = scaleRef.current,
      scroll = { left: viewport.scrollLeft, top: viewport.scrollTop }
    ) => {
      const scaledCanvas = {
        width: size.width * scaleValue,
        height: size.height * scaleValue,
      };
      return clampCanvasPan({
        offset,
        viewport: { width: viewport.clientWidth, height: viewport.clientHeight },
        canvas: scaledCanvas,
        origin: canvasViewportOrigin(viewport, scaleValue, scroll),
        minimumVisible: MIN_VISIBLE_CANVAS,
      });
    },
    [canvasViewportOrigin, size.width, size.height]
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      if (viewMode === "fit") {
        const nextScale = fitCanvasZoom(
          { width: el.clientWidth, height: el.clientHeight },
          { width: size.width, height: size.height },
          PANE_PADDING
        );
        scaleRef.current = nextScale;
        setScale(nextScale);
        return;
      }
      const nextPan = constrainPanOffset(panOffsetRef.current, el);
      if (
        nextPan.x !== panOffsetRef.current.x ||
        nextPan.y !== panOffsetRef.current.y
      ) {
        panOffsetRef.current = nextPan;
        setPanOffset(nextPan);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [constrainPanOffset, size.width, size.height, viewMode]);

  const dragGuides = useMemo<DistanceMeasurement[]>(() => {
    if (!dragBlock) return [];
    return computeDragSpacingGuides(dragBlock.id, dragBlock.x, dragBlock.y, dragBlock.w, dragBlock.h);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute when drag position or blocks change
  }, [dragBlock, blocks]);

  const distanceReferenceIds = useMemo(
    () =>
      new Set(
        dragGuides.flatMap((measurement) =>
          measurement.referenceBlockId ? [measurement.referenceBlockId] : []
        )
      ),
    [dragGuides]
  );

  const edgeMeasurements = useMemo<DistanceMeasurement[]>(() => {
    if (!dragBlock) return [];
    const right = dragBlock.x + dragBlock.w;
    const bottom = dragBlock.y + dragBlock.h;
    const centerX = dragBlock.x + dragBlock.w / 2;
    const centerY = dragBlock.y + dragBlock.h / 2;
    const horizontal = (
      key: string,
      start: number,
      end: number,
      y: number
    ): DistanceMeasurement => ({
      key,
      orientation: "horizontal",
      x: Math.min(start, end),
      y,
      length: Math.abs(end - start),
      value: Math.round(end - start),
    });
    const vertical = (
      key: string,
      start: number,
      end: number,
      x: number
    ): DistanceMeasurement => ({
      key,
      orientation: "vertical",
      x,
      y: Math.min(start, end),
      length: Math.abs(end - start),
      value: Math.round(end - start),
    });
    return [
      horizontal("left", 0, dragBlock.x, centerY),
      horizontal("right", right, size.width, centerY),
      vertical("top", 0, dragBlock.y, centerX),
      vertical("bottom", bottom, size.height, centerX),
    ];
  }, [dragBlock, size.width, size.height]);

  function stagePoint(e: { clientX: number; clientY: number }): { x: number; y: number } {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }

  function applyManualZoom(nextValue: number, anchor?: { x: number; y: number }) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const previousScale = scaleRef.current;
    const nextScale = clampZoom(nextValue);
    const zoomAnchor = anchor ?? {
      x: viewport.clientWidth / 2,
      y: viewport.clientHeight / 2,
    };
    const desiredPan = zoomPanOffset({
      previousScale,
      nextScale,
      pan: panOffsetRef.current,
      anchor: zoomAnchor,
      previousOrigin: canvasViewportOrigin(viewport, previousScale),
      nextOrigin: canvasViewportOrigin(viewport, nextScale),
    });
    const nextPan = constrainPanOffset(desiredPan, viewport, nextScale);

    setViewMode("manual");
    scaleRef.current = nextScale;
    setScale(nextScale);
    panOffsetRef.current = nextPan;
    setPanOffset(nextPan);
  }

  function handleFitCanvas() {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const nextScale = fitCanvasZoom(
      { width: viewport.clientWidth, height: viewport.clientHeight },
      { width: size.width, height: size.height },
      PANE_PADDING
    );
    setViewMode("fit");
    scaleRef.current = nextScale;
    setScale(nextScale);
    const centeredPan = { x: 0, y: 0 };
    panOffsetRef.current = centeredPan;
    setPanOffset(centeredPan);
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }

  function handleWheel(event: WheelEvent) {
    if (!event.metaKey && !event.ctrlKey) return;
    event.preventDefault();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const factor = Math.exp(-event.deltaY * 0.002);
    applyManualZoom(scaleRef.current * factor, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (event: WheelEvent) => handleWheel(event);
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
    // Canvas dimensions are the only render values captured by applyManualZoom;
    // the current scale is read from scaleRef so rapid wheel events accumulate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height]);

  function handlePanStart(event: React.PointerEvent<HTMLDivElement>) {
    const shouldPan = event.button === 1 || event.button === 2;
    if (!shouldPan) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPanX: panOffsetRef.current.x,
      startPanY: panOffsetRef.current.y,
    };
    setViewMode("manual");
    setPanning(true);
  }

  function handlePanMove(event: React.PointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    event.preventDefault();
    const nextOffset = constrainPanOffset(
      {
        x: pan.startPanX + event.clientX - pan.startX,
        y: pan.startPanY + event.clientY - pan.startY,
      },
      event.currentTarget
    );
    panOffsetRef.current = nextOffset;
    setPanOffset(nextOffset);
  }

  function endPan(event: React.PointerEvent<HTMLDivElement>) {
    if (panRef.current?.pointerId !== event.pointerId) return;
    panRef.current = null;
    setPanning(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!Array.from(e.dataTransfer.types).includes(CARDINAL_BLOCK_MIME)) return;
    if (e.dataTransfer.getData(CARDINAL_BLOCK_MIME) !== CARDINAL_NEW_BLOCK_PAYLOAD) return;
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
  ): DistanceMeasurement[] {
    const result: DistanceMeasurement[] = [];
    const right = nx + w;
    const bottom = ny + h;

    let bestUp: { id: string; dist: number; x: number; edge: number } | null = null;
    let bestDown: { id: string; dist: number; x: number; edge: number } | null = null;
    let bestLeft: { id: string; dist: number; y: number; edge: number } | null = null;
    let bestRight: { id: string; dist: number; y: number; edge: number } | null = null;

    const edges = blocks
      .filter((block) => block.id !== id)
      .map((block) => ({
        id: block.id,
        x: block.x,
        y: block.y,
        w: block.width,
        h: block.height,
      }));
    for (const e of edges) {
      const eRight = e.x + e.w;
      const eBottom = e.y + e.h;
      const overlapXStart = Math.max(nx, e.x);
      const overlapXEnd = Math.min(right, eRight);
      const overlapYStart = Math.max(ny, e.y);
      const overlapYEnd = Math.min(bottom, eBottom);
      const overlapsHorizontally = overlapXEnd > overlapXStart;
      const overlapsVertically = overlapYEnd > overlapYStart;

      if (overlapsVertically && eRight <= nx) {
        const dist = nx - eRight;
        if (!bestLeft || dist < bestLeft.dist) {
          bestLeft = {
            id: e.id,
            dist,
            y: (overlapYStart + overlapYEnd) / 2,
            edge: eRight,
          };
        }
      }
      if (overlapsVertically && e.x >= right) {
        const dist = e.x - right;
        if (!bestRight || dist < bestRight.dist) {
          bestRight = {
            id: e.id,
            dist,
            y: (overlapYStart + overlapYEnd) / 2,
            edge: e.x,
          };
        }
      }
      if (overlapsHorizontally && eBottom <= ny) {
        const dist = ny - eBottom;
        if (!bestUp || dist < bestUp.dist) {
          bestUp = {
            id: e.id,
            dist,
            x: (overlapXStart + overlapXEnd) / 2,
            edge: eBottom,
          };
        }
      }
      if (overlapsHorizontally && e.y >= bottom) {
        const dist = e.y - bottom;
        if (!bestDown || dist < bestDown.dist) {
          bestDown = {
            id: e.id,
            dist,
            x: (overlapXStart + overlapXEnd) / 2,
            edge: e.y,
          };
        }
      }
    }

    if (bestLeft) {
      result.push({
        key: "block-left",
        orientation: "horizontal",
        x: bestLeft.edge,
        y: bestLeft.y,
        length: bestLeft.dist,
        value: Math.round(bestLeft.dist),
        referenceBlockId: bestLeft.id,
      });
    }
    if (bestRight) {
      result.push({
        key: "block-right",
        orientation: "horizontal",
        x: right,
        y: bestRight.y,
        length: bestRight.dist,
        value: Math.round(bestRight.dist),
        referenceBlockId: bestRight.id,
      });
    }
    if (bestUp) {
      result.push({
        key: "block-top",
        orientation: "vertical",
        x: bestUp.x,
        y: bestUp.edge,
        length: bestUp.dist,
        value: Math.round(bestUp.dist),
        referenceBlockId: bestUp.id,
      });
    }
    if (bestDown) {
      result.push({
        key: "block-bottom",
        orientation: "vertical",
        x: bestDown.x,
        y: bottom,
        length: bestDown.dist,
        value: Math.round(bestDown.dist),
        referenceBlockId: bestDown.id,
      });
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
    <div className="relative min-h-96 lg:h-full lg:min-h-0">
      <div
        data-template-selection-preserving
        role="toolbar"
        aria-label="Canvas view controls"
        className="absolute left-3 top-3 z-30 flex max-w-[calc(100%_-_1.5rem)] flex-wrap items-center gap-1 rounded-xl border border-zinc-200 bg-white/95 p-1 shadow-md backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95"
      >
        <EditorTooltip label="Spacing overlay (S)" align="left">
          <button
            type="button"
            onClick={() => onShowSpacingChange?.(!showSpacing)}
            aria-label="Toggle spacing overlay"
            aria-pressed={showSpacing}
            className={
              "grid size-8 place-items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 " +
              (showSpacing
                ? "bg-zinc-950 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-950"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white")
            }
          >
            <EditorIcon name="ruler" />
          </button>
        </EditorTooltip>

        <EditorTooltip label="Toggle grid">
          <button
            type="button"
            onClick={() => onShowGridChange?.(!showGrid)}
            aria-label="Toggle grid"
            aria-pressed={showGrid}
            className={
              "grid size-8 place-items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 " +
              (showGrid
                ? "bg-zinc-950 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-950"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white")
            }
          >
            <EditorIcon name="grid-3x3" />
          </button>
        </EditorTooltip>

        {showGrid && (
          <EditorTooltip label="Grid size in pixels" align="left">
            <label className="flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              <DraftNumberInput
                value={gridSize}
                onCommit={(size) => onGridSizeChange?.(size)}
                aria-label="Grid size in pixels"
                className="w-7 bg-transparent text-right text-xs font-semibold text-zinc-800 outline-none dark:text-zinc-100"
                min={4}
                max={64}
                integer
              />
              px
            </label>
          </EditorTooltip>
        )}

        <span className="mx-0.5 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
        <button
          type="button"
          aria-label="Zoom out"
          disabled={scale <= MIN_ZOOM + 0.001}
          onClick={() => applyManualZoom(stepZoom(scale, -1))}
          className="grid size-8 place-items-center rounded-lg text-base font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-35 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          −
        </button>
        <output
          aria-label="Current zoom"
          className="min-w-12 text-center text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-200"
        >
          {Math.round(scale * 100)}%
        </output>
        <button
          type="button"
          aria-label="Zoom in"
          disabled={scale >= MAX_ZOOM - 0.001}
          onClick={() => applyManualZoom(stepZoom(scale, 1))}
          className="grid size-8 place-items-center rounded-lg text-base font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-35 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Fit canvas"
          aria-pressed={viewMode === "fit"}
          onClick={handleFitCanvas}
          className="h-8 rounded-lg px-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Fit
        </button>
      </div>

      <div
        ref={viewportRef}
        data-testid="canvas-viewport"
        onPointerDownCapture={handlePanStart}
        onPointerMove={handlePanMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onLostPointerCapture={endPan}
        onContextMenu={(event) => event.preventDefault()}
        className="min-h-96 overflow-auto rounded-2xl border bg-zinc-50 p-8 shadow-sm dark:bg-zinc-950/40 lg:h-full lg:min-h-0"
        style={{ cursor: panning ? "grabbing" : undefined }}
      >
        <div
          data-testid="canvas-pan-layer"
          className="relative mx-auto"
          style={{
            width: size.width * scale,
            height: size.height * scale,
            transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: size.width,
              height: size.height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <CanvasStage
              canvas={editorCanvas}
              showGrid={showGrid}
              gridSize={gridSize}
              content={
                <>
                  {[...blocks]
                    .sort((a, b) => a.z - b.z)
                    .map((block) => (
                      <div
                        key={block.id}
                        className="pointer-events-none absolute"
                        style={{
                          left: block.x,
                          top: block.y,
                          width: block.width,
                          height: block.height,
                          zIndex: block.z,
                        }}
                      >
                        <BlockPreview block={block} />
                      </div>
                    ))}
                </>
              }
              interaction={
                <div
                ref={stageRef}
                data-testid="canvas-drop-layer"
                data-template-selection-preserving
                className="absolute inset-0"
                onPointerDown={() => onSelect(null)}
                onDragOver={(e) => {
                  if (Array.from(e.dataTransfer.types).includes(CARDINAL_BLOCK_MIME)) {
                    e.preventDefault();
                  }
                }}
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
                    backgroundColor: guidePalette.paddingFill,
                    border: `1px dashed ${guidePalette.paddingBorder}`,
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
                    backgroundColor: guidePalette.gapFill,
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
                    selected={selectedIds.includes(block.id)}
                    scale={scale}
                    interacting={interacting === block.id}
                    comparisonOutline={
                      distanceReferenceIds.has(block.id)
                        ? guidePalette.measurement
                        : undefined
                    }
                    onSelect={(additive) => onSelect(block.id, additive)}
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
                    borderLeft: `1px dashed ${guidePalette.alignment}`,
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
                    borderTop: `1px dashed ${guidePalette.alignment}`,
                  }}
                />
              ))}
              {dragGuides.map((measurement) => (
                <DistanceMeasurementGuide
                  key={measurement.key}
                  measurement={measurement}
                  inv={1 / scale}
                  palette={guidePalette}
                />
              ))}
              {edgeMeasurements.map((measurement) => (
                <DistanceMeasurementGuide
                  key={measurement.key}
                  measurement={measurement}
                  inv={1 / scale}
                  palette={guidePalette}
                />
              ))}
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DistanceMeasurementGuide({
  measurement,
  inv,
  palette,
}: {
  measurement: DistanceMeasurement;
  inv: number;
  palette: CanvasGuidePalette;
}) {
  const lineWidth = Math.max(inv, 0.5);
  const tickSize = 6 * inv;
  const labelStyle: React.CSSProperties = {
    fontSize: 10 * inv,
    lineHeight: `${14 * inv}px`,
    paddingInline: 3 * inv,
    backgroundColor: palette.labelBackground,
    color: palette.labelText,
  };

  if (measurement.orientation === "horizontal") {
    return (
      <span
        className="pointer-events-none absolute z-30"
        style={{
          left: measurement.x,
          top: measurement.y,
          width: measurement.length,
          height: 0,
          borderTop: `${lineWidth}px solid ${palette.measurement}`,
        }}
      >
        <span
          className="absolute"
          style={{
            left: 0,
            top: -tickSize / 2,
            height: tickSize,
            borderLeft: `${lineWidth}px solid ${palette.measurement}`,
          }}
        />
        <span
          className="absolute"
          style={{
            right: 0,
            top: -tickSize / 2,
            height: tickSize,
            borderRight: `${lineWidth}px solid ${palette.measurement}`,
          }}
        />
        <span
          className="absolute whitespace-nowrap rounded font-mono"
          style={{
            ...labelStyle,
            left: measurement.length / 2,
            top: -8 * inv,
            transform: "translate(-50%, -50%)",
          }}
        >
          {measurement.value}px
        </span>
      </span>
    );
  }

  return (
    <span
      className="pointer-events-none absolute z-30"
      style={{
        left: measurement.x,
        top: measurement.y,
        width: 0,
        height: measurement.length,
        borderLeft: `${lineWidth}px solid ${palette.measurement}`,
      }}
    >
      <span
        className="absolute"
        style={{
          left: -tickSize / 2,
          top: 0,
          width: tickSize,
          borderTop: `${lineWidth}px solid ${palette.measurement}`,
        }}
      />
      <span
        className="absolute"
        style={{
          left: -tickSize / 2,
          bottom: 0,
          width: tickSize,
          borderBottom: `${lineWidth}px solid ${palette.measurement}`,
        }}
      />
      <span
        className="absolute whitespace-nowrap rounded font-mono"
        style={{
          ...labelStyle,
          left: 8 * inv,
          top: measurement.length / 2,
          transform: "translateY(-50%)",
        }}
      >
        {measurement.value}px
      </span>
    </span>
  );
}

function BlockFrame({
  block,
  selected,
  scale,
  interacting,
  comparisonOutline,
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
  comparisonOutline?: string;
  onSelect: (additive: boolean) => void;
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
    onSelect(e.metaKey || e.ctrlKey);
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
    // Square block types keep a 1:1 aspect ratio: the dominant axis wins.
    if (isSquareBlock(block.type)) {
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
  const outlineColor = interacting
    ? "#3b82f6"
    : comparisonOutline ?? (selected ? "#3b82f6" : undefined);

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
        outline: outlineColor ? `${1.5 * inv}px solid ${outlineColor}` : undefined,
        outlineOffset: 0,
      }}
      onPointerDown={(e) => beginGesture(e, "move", e.currentTarget)}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onDragStart={(e) => e.preventDefault()}
    >
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
