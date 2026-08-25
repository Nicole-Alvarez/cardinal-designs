"use client";

import type { CSSProperties, ReactNode } from "react";
import type { TemplateCanvas } from "@/features/templates/types";

export default function CanvasStage({
  canvas,
  children,
  showGrid = false,
  gridSize = 8,
}: {
  canvas: TemplateCanvas;
  children?: ReactNode;
  showGrid?: boolean;
  gridSize?: number;
}) {
  const style: CSSProperties = {
    width: canvas.width === "auto" ? "100%" : canvas.width,
    height: canvas.height === "auto" ? undefined : canvas.height,
    minHeight: canvas.height === "auto" ? "384px" : undefined,
    backgroundColor: canvas.backgroundColor,
    color: canvas.textColor,
    boxSizing: "border-box",
    maxWidth: "100%",
    marginInline: canvas.width === "auto" ? undefined : "auto",
    overflow: "hidden",
    borderWidth: canvas.borderWidth > 0 ? canvas.borderWidth : undefined,
    borderStyle: canvas.borderWidth > 0 ? "solid" : undefined,
    borderColor: canvas.borderWidth > 0 ? canvas.borderColor : undefined,
  };

  const gridStyle: CSSProperties = showGrid
    ? {
        backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }
    : {};

  return (
    <div className="relative" style={{ ...style, ...gridStyle }}>
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
      <div className="relative">{children}</div>
    </div>
  );
}
