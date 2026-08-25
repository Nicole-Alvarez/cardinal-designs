import { EditorIcon, EditorTooltip } from "./editor-controls";

export default function TemplatesTable({
  templates,
  onDelete,
  deletingId,
}: {
  templates: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  }[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  return (
    <section
      aria-label="Templates"
      className="rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="hidden grid-cols-[minmax(0,1fr)_12rem_12rem_5.5rem] items-center gap-4 border-b border-zinc-200 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500 md:grid">
        <span>Template</span>
        <span>Last updated</span>
        <span>Created</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {templates.map((template) => {
          const deleting = deletingId === template.id;

          return (
            <article
              key={template.id}
              className="group grid gap-4 px-4 py-4 transition-colors first:rounded-t-3xl last:rounded-b-3xl hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 md:grid-cols-[minmax(0,1fr)_12rem_12rem_5.5rem] md:items-center md:px-5"
            >
              <a
                href={`/dashboard/templates/${template.id}`}
                className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 transition group-hover:border-violet-200 group-hover:bg-violet-50 group-hover:text-violet-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:border-violet-900 dark:group-hover:bg-violet-950/60 dark:group-hover:text-violet-300">
                  <EditorIcon name="layout-template" className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    {template.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                    Open template editor
                  </span>
                </span>
              </a>

              <TemplateDate
                label="Last updated"
                value={template.updatedAt}
                icon="clock-3"
              />
              <TemplateDate
                label="Created"
                value={template.createdAt}
                icon="calendar-plus"
              />

              <div className="flex items-center justify-end gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800 md:border-0 md:pt-0">
                <EditorTooltip label={`Open ${template.title}`}>
                  <a
                    href={`/dashboard/templates/${template.id}`}
                    aria-label={`Open ${template.title}`}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
                  >
                    <EditorIcon name="arrow-up-right" className="size-4" />
                  </a>
                </EditorTooltip>
                <EditorTooltip
                  label={deleting ? "Deleting template" : `Delete ${template.title}`}
                  align="right"
                >
                  <button
                    type="button"
                    onClick={() => onDelete(template.id)}
                    disabled={deleting}
                    aria-label={deleting ? `Deleting ${template.title}` : `Delete ${template.title}`}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-50 dark:text-zinc-500 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                  >
                    <EditorIcon
                      name={deleting ? "loader-circle" : "trash-2"}
                      className={`size-4 ${deleting ? "animate-spin" : ""}`}
                    />
                  </button>
                </EditorTooltip>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TemplateDate({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  const date = new Date(value);

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
      <EditorIcon name={icon} className="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500 md:hidden" />
      <span className="font-medium text-zinc-700 dark:text-zinc-300 md:hidden">
        {label}:
      </span>
      <time dateTime={value} title={date.toLocaleString()}>
        {date.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </time>
    </div>
  );
}
