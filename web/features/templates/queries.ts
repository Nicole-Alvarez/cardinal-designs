import { apiFetch } from "@/lib/api";
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

export async function createTemplate(): Promise<Template> {
  const data = await apiFetch("/api/templates", {
    method: "POST",
    credentials: "include",
  });
  return data.template;
}

export interface UpdateTemplateInput {
  title?: string;
  content?: unknown;
  html?: string | null;
  react?: string | null;
  angular?: string | null;
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
