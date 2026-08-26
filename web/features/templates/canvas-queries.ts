import { apiFetch } from "@/lib/api";
import type { Canvas, CanvasSummary } from "./types";

export async function listCanvases(templateId: string): Promise<CanvasSummary[]> {
  const data = await apiFetch(`/api/templates/${templateId}/canvases`, {
    credentials: "include",
  });
  return data.canvases ?? [];
}

export async function getCanvas(
  templateId: string,
  canvasId: string
): Promise<Canvas> {
  const data = await apiFetch(`/api/templates/${templateId}/canvases/${canvasId}`, {
    credentials: "include",
  });
  return data.canvas;
}

export async function createCanvas(templateId: string): Promise<Canvas> {
  const data = await apiFetch(`/api/templates/${templateId}/canvases`, {
    method: "POST",
    credentials: "include",
  });
  return data.canvas;
}

export interface UpdateCanvasInput {
  title?: string;
  position?: number;
  content?: unknown;
  html?: string | null;
  react?: string | null;
  angular?: string | null;
}

export async function updateCanvas(
  templateId: string,
  canvasId: string,
  input: UpdateCanvasInput
): Promise<Canvas> {
  const data = await apiFetch(`/api/templates/${templateId}/canvases/${canvasId}`, {
    method: "PUT",
    credentials: "include",
    body: JSON.stringify(input),
  });
  return data.canvas;
}

export async function deleteCanvas(
  templateId: string,
  canvasId: string
): Promise<void> {
  await apiFetch(`/api/templates/${templateId}/canvases/${canvasId}`, {
    method: "DELETE",
    credentials: "include",
  });
}
