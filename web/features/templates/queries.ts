import { apiFetch, apiUpload } from "@/lib/api";
import type { Template, TemplateCanvas, TemplateContent, TemplateSummary } from "./types";

export async function listTemplates(): Promise<TemplateSummary[]> {
  const data = await apiFetch("/api/templates", { credentials: "include" });
  return data.templates ?? [];
}

export async function getTemplate(id: string): Promise<Template> {
  const data = await apiFetch(`/api/templates/${id}`, {
    credentials: "include",
  });
  return data.template;
}

export async function createTemplate(input?: {
  title?: string;
  description?: string;
  isPrivate?: boolean;
  isCode?: boolean;
}): Promise<Template> {
  const data = await apiFetch("/api/templates", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(input ?? {}),
    headers: { "Content-Type": "application/json" },
  });
  return data.template;
}

export interface UpdateTemplateInput {
  title?: string;
  description?: string;
  isPrivate?: boolean;
  isCode?: boolean;
}

export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput
): Promise<Template> {
  const data = await apiFetch(`/api/templates/${id}`, {
    method: "PUT",
    credentials: "include",
    body: JSON.stringify(input),
  });
  return data.template;
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiFetch(`/api/templates/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}

export async function createAiLayout(prompt: string, canvas: TemplateCanvas): Promise<TemplateContent> {
  const data = await apiFetch("/api/templates/ai-create", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ prompt, canvas }),
  });
  return data.content;
}

export async function createAiReferenceLayout(prompt: string, canvas: TemplateCanvas, reference: File, mode: "match" | "inspiration", signal?: AbortSignal): Promise<TemplateContent> {
  const body = new FormData();
  body.append("reference", reference);
  body.append("prompt", prompt);
  body.append("canvas", JSON.stringify(canvas));
  body.append("mode", mode);
  const response = await fetch("/api/templates/ai-create/reference", { method: "POST", credentials: "include", body, signal });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? `Request failed (${response.status})`);
  return data.content;
}

/** Uploads an image and returns its permanent public serving URL. */
export async function uploadBlockImage(file: File): Promise<string> {
  const data = await apiUpload<{ pathname: string; url: string }>("/api/uploads", file);
  try {
    if (new URL(data.url).protocol !== "https:") throw new Error();
  } catch {
    throw new Error("Upload did not return a portable image URL");
  }
  return data.url;
}
