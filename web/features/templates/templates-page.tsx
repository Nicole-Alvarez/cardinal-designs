"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EditorIcon } from "@/components/dashboard/templates/editor-controls";
import TemplatesTable from "@/components/dashboard/templates/templates-table";
import ConfirmDialog from "@/components/dashboard/templates/confirm-dialog";
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

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

  function handleDeleteRequest(id: string) {
    const template = templates?.find((t) => t.id === id);
    setDeleteTarget({ id, title: template?.title ?? "this template" });
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    setError(null);
    setDeleteConfirmOpen(false);
    try {
      await deleteTemplate(deleteTarget.id);
      setTemplates((prev) => prev?.filter((t) => t.id !== deleteTarget.id) ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white px-5 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:px-7 sm:py-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-gradient-to-br from-violet-200/60 via-sky-100/30 to-transparent blur-2xl dark:from-violet-900/30 dark:via-sky-900/10"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 shadow-sm dark:border-violet-900/70 dark:bg-violet-950/60 dark:text-violet-300">
              <EditorIcon name="layout-template" className="size-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
                  Templates
                </h1>
                {templates !== null && (
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {templates.length} {templates.length === 1 ? "template" : "templates"}
                  </span>
                )}
              </div>
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Create, manage, and open reusable card designs from one workspace.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-white dark:focus-visible:ring-offset-zinc-900 sm:w-auto"
          >
            <EditorIcon
              name={creating ? "loader-circle" : "plus"}
              className={`size-4 ${creating ? "animate-spin" : ""}`}
            />
            {creating ? "Creating..." : "Create template"}
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3.5 text-sm text-red-700 shadow-sm dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
        >
          <EditorIcon name="circle-alert" className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-0.5 text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {templates === null ? (
        <div
          role="status"
          className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <EditorIcon name="loader-circle" className="size-5 animate-spin" />
          </span>
          <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Loading templates
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Preparing your design workspace...
          </p>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-gradient-to-b from-white to-zinc-50/70 px-6 py-12 text-center dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950/40">
          <span className="flex size-14 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <EditorIcon name="inbox" className="size-6" />
          </span>
          <h2 className="mt-5 text-base font-semibold text-zinc-950 dark:text-zinc-50">
            Create your first template
          </h2>
          <p className="mt-1.5 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Start with a blank canvas, then design it visually or switch to code.
          </p>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-600"
          >
            <EditorIcon
              name={creating ? "loader-circle" : "sparkles"}
              className={`size-4 ${creating ? "animate-spin" : ""}`}
            />
            {creating ? "Creating..." : "Start designing"}
          </button>
        </div>
      ) : (
        <TemplatesTable
          templates={templates}
          onDelete={handleDeleteRequest}
          deletingId={deletingId}
        />
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete template?"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This will also delete all canvases. This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeleteTarget(null);
        }}
        loading={deletingId !== null}
      />

      {creating && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-zinc-950/70"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-8 py-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <EditorIcon name="loader-circle" className="size-6 animate-spin text-zinc-500 dark:text-zinc-400" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Creating your template...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
