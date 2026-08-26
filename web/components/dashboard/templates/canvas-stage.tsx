"use client";

import type { CSSProperties, ReactNode } from "react";
import { canvasGuidePalette } from "@/features/templates/canvas-guides";
import type { TemplateCanvas } from "@/features/templates/types";

export default function CanvasStage({
  canvas,
  content,
  interaction,
  showGrid = false,
  gridSize = 8,
}: {
  canvas: TemplateCanvas;
  content?: ReactNode;
  interaction?: ReactNode;
  showGrid?: boolean;
  gridSize?: number;
}) {
  const guidePalette = canvasGuidePalette(canvas.backgroundColor, canvas.textColor);
  const rootStyle: CSSProperties = {
    width: canvas.width === "auto" ? "100%" : canvas.width,
    height: canvas.height === "auto" ? undefined : canvas.height,
    minHeight: canvas.height === "auto" ? "384px" : undefined,
    color: canvas.textColor,
    boxSizing: "border-box",
    marginInline: canvas.width === "auto" ? undefined : "auto",
  };
  const contentStyle: CSSProperties = {
    backgroundColor: canvas.backgroundColor,
    boxSizing: "border-box",
    overflow: "hidden",
    borderWidth: canvas.borderWidth > 0 ? canvas.borderWidth : undefined,
    borderStyle: canvas.borderWidth > 0 ? "solid" : undefined,
    borderColor: canvas.borderWidth > 0 ? canvas.borderColor : undefined,
    borderRadius: canvas.borderRadius || undefined,
  };

  const gridStyle: CSSProperties = showGrid
    ? {
        backgroundImage: `linear-gradient(to right, ${guidePalette.grid} 1px, transparent 1px), linear-gradient(to bottom, ${guidePalette.grid} 1px, transparent 1px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: "left top",
      }
    : {};

  return (
    <div className="relative" style={rootStyle}>
      <div
        data-testid="canvas-content-clip"
        className="absolute inset-0"
        style={{ ...contentStyle, ...gridStyle }}
      >
        {canvas.overlayImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={canvas.overlayImage}
            alt=""
            style={{
              position: "absolute",
              top: canvas.overlayMargin,
              right: canvas.overlayMargin,
              bottom: canvas.overlayMargin,
              left: canvas.overlayMargin,
              padding: canvas.overlayPadding,
              boxSizing: "border-box",
              objectFit: canvas.overlayFit,
              opacity: canvas.overlayOpacity / 100,
              pointerEvents: "none",
            }}
          />
        )}
        {content}
      </div>
      <div
        data-testid="canvas-interaction-layer"
        className="absolute inset-0"
        style={{ overflow: "visible" }}
      >
        {interaction}
      </div>
    </div>
  );
}
