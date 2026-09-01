"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, buttonClassName } from "@/components/ui/button";
import { listTemplates } from "../templates/queries";
import type { TemplateSummary } from "../templates/types";

export default function DashboardPage({ name }: { name: string }) {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const creatingRef = useRef(false);

  const loadRecent = useCallback(async () => {
    setLoadingRecent(true);
    setRecentError(null);

    try {
      setTemplates(await listTemplates());
    } catch (error) {
      setRecentError((error as Error).message || "Recent templates are unavailable.");
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRecent();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRecent]);

  async function handleCreate() {
    if (creatingRef.current) return;

    creatingRef.current = true;
    setCreating(true);
    setCreationError(null);

    try {
      router.push("/dashboard/templates/new");
    } catch (error) {
      setCreationError((error as Error).message || "Could not create a template. Try again.");
      creatingRef.current = false;
      setCreating(false);
    }
  }

  const recent = [...templates]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
          Welcome back, {name}
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Create and manage the card templates your team uses every day.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={handleCreate} disabled={creating}>
            {creating ? "Creating template..." : "Create template"}
          </Button>
          <Link href="/dashboard/templates" className={buttonClassName("secondary")}>
            Browse templates
          </Link>
        </div>
        {creating && (
          <p role="status" aria-live="polite" className="sr-only">
            Creating template...
          </p>
        )}
        {creationError && (
          <p role="alert" className="mt-3 text-sm text-status-danger">
            {creationError}
          </p>
        )}
      </header>

      <section className="mt-12 border-t border-border-subtle pt-6" aria-labelledby="recent-work-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="recent-work-heading" className="text-base font-semibold text-text-primary">
            Recent work
          </h2>
          {!loadingRecent && !recentError && recent.length > 0 && (
            <Link
              href="/dashboard/templates"
              className="text-sm font-medium text-text-secondary underline decoration-border-strong underline-offset-4 transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              View all
            </Link>
          )}
        </div>

        {loadingRecent ? (
          <div className="mt-5 space-y-3" aria-busy="true">
            <p className="text-sm text-text-secondary">Loading recent templates...</p>
            <div className="h-12 animate-pulse bg-surface-2" />
            <div className="h-12 animate-pulse bg-surface-2" />
          </div>
        ) : recentError ? (
          <div role="status" className="mt-5 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            <p>{recentError}</p>
            <Button type="button" variant="ghost" size="compact" onClick={() => void loadRecent()}>
              Try again
            </Button>
          </div>
        ) : recent.length === 0 ? (
          <p className="mt-5 text-sm leading-6 text-text-secondary">
            No templates yet. Create one to start building reusable card designs.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-border-subtle">
            {recent.map((template) => (
              <li key={template.id}>
                <Link
                  href={`/dashboard/templates/${template.id}`}
                  className="block py-4 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <p className="font-medium text-text-primary">{template.title}</p>
                  {template.description && (
                    <p className="mt-1 text-sm leading-6 text-text-secondary">{template.description}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
