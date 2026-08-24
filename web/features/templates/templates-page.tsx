"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TemplatesTable from "@/components/dashboard/templates/templates-table";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
} from "./queries";
import type { TemplateSummary } from "./types";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    listTemplates()
      .then(setTemplates)
      .catch((err: Error) => setError(err.message));
  }, []);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const template = await createTemplate();
      router.push(`/dashboard/templates/${template.id}`);
    } catch (err) {
      setError((err as Error).message);
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev?.filter((t) => t.id !== id) ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {creating ? "Creating..." : "Create Template"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      {templates === null ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
      ) : templates.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No templates yet. Click &quot;Create Template&quot; to start one.
        </p>
      ) : (
        <TemplatesTable
          templates={templates}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}
    </div>
  );
}
