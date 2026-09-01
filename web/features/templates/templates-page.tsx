"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EditorIcon } from "@/components/dashboard/templates/editor-controls";
import TemplatesTable from "@/components/dashboard/templates/templates-table";
import ConfirmDialog from "@/components/dashboard/templates/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  deleteTemplate,
  listTemplates,
} from "./queries";
import type { TemplateSummary } from "./types";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateSummary[] | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const loadTemplateList = useCallback(async () => {
    setLoadingTemplates(true);
    setError(null);
    try {
      setTemplates(await listTemplates());
    } catch (err) {
      setTemplates(null);
      setError((err as Error).message);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTemplateList();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTemplateList]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      router.push("/dashboard/templates/new");
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

  const initialLoadFailed = !loadingTemplates && templates === null && error !== null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-5 border-b border-border-subtle pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <EditorIcon name="layout-template" className="size-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
                  Templates
                </h1>
                {templates !== null && (
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-secondary">
                    {templates.length} {templates.length === 1 ? "template" : "templates"}
                  </span>
                )}
              </div>
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-text-secondary">
                Create, manage, and open reusable card designs from one workspace.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="w-full gap-2 sm:w-auto"
          >
            <EditorIcon
              name={creating ? "loader-circle" : "plus"}
              className={`size-4 ${creating ? "animate-spin" : ""}`}
            />
            {creating ? "Creating..." : "Create template"}
          </Button>
      </header>

      {error && !initialLoadFailed && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl bg-red-950/40 px-4 py-3.5 text-sm text-red-300"
        >
          <EditorIcon name="circle-alert" className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-0.5 text-red-300">{error}</p>
          </div>
        </div>
      )}

      {loadingTemplates ? (
        <div
          role="status"
          aria-label="Loading templates"
          className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-1"
        >
          <span className="sr-only">Loading templates</span>
          {[0, 1, 2].map((row) => (
            <article
              key={row}
              aria-hidden="true"
              className="grid animate-pulse gap-4 border-b border-border-subtle px-4 py-4 last:border-0 md:grid-cols-[minmax(0,1fr)_9rem_10rem_10rem_3rem] md:items-center md:px-5"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-surface-3" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-2/5 rounded bg-surface-3" />
                  <div className="h-2.5 w-3/5 rounded bg-surface-2" />
                </div>
              </div>
              <div className="h-5 w-24 rounded-full bg-surface-2" />
              <div className="h-3 w-20 rounded bg-surface-2" />
              <div className="h-3 w-20 rounded bg-surface-2" />
              <div className="h-9 w-9 rounded-lg bg-surface-2" />
            </article>
          ))}
        </div>
      ) : templates === null ? (
        <div
          role="alert"
          className="flex min-h-64 flex-col items-center justify-center rounded-2xl bg-red-950/30 px-6 py-12 text-center"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            <EditorIcon name="cloud-off" className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-red-950 dark:text-red-100">
            Could not load templates
          </h2>
          <p className="mt-1 max-w-md text-sm leading-6 text-red-700 dark:text-red-300">
            {error ?? "Check your connection and try again."}
          </p>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void loadTemplateList()}
            className="mt-5"
          >
            Try again
          </Button>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface-1 px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-text-secondary">
            <EditorIcon name="inbox" className="size-6" />
          </span>
          <h2 className="mt-5 text-base font-semibold text-text-primary">
            Create your first template
          </h2>
          <p className="mt-1.5 max-w-sm text-sm leading-6 text-text-secondary">
            Start with a blank canvas, then design it visually or switch to code.
          </p>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="mt-5 gap-2"
          >
            <EditorIcon
              name={creating ? "loader-circle" : "sparkles"}
              className={`size-4 ${creating ? "animate-spin" : ""}`}
            />
            {creating ? "Creating..." : "Start designing"}
          </Button>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-app/80"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface-3 px-8 py-6 shadow-xl">
            <EditorIcon name="loader-circle" className="size-6 animate-spin text-accent" />
            <p className="text-sm font-medium text-text-secondary">
              Creating your template...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
