import { apiFetch, apiUpload } from "@/lib/api";
import type { Template, TemplateSummary } from "./types";

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
