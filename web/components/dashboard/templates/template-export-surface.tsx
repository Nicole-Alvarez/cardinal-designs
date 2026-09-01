"use client";

import type { CSSProperties } from "react";
import CanvasStage from "./canvas-stage";
import BlockPreview from "./block-preview";
import type { TemplateBlock, TemplateContent } from "@/features/templates/types";

function blockFrame(block: TemplateBlock) {
  const style: CSSProperties = { position: "absolute", left: block.x, top: block.y, width: block.width, height: block.height, zIndex: block.z };
  return <div key={block.id} style={style}><BlockPreview block={block} /></div>;
}

export function CanvasExportSurface({ content }: { content: TemplateContent }) {
  return <CanvasStage canvas={content.canvas} content={content.blocks.map(blockFrame)} />;
}

export function BlockExportSurface({ block }: { block: TemplateBlock }) {
  return <div style={{ width: block.width, height: block.height, background: "transparent" }}><BlockPreview block={block} /></div>;
}
