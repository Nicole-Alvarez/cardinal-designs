import type { TemplateSummary } from "@/features/templates/types";
import { EditorIcon, EditorTooltip } from "./editor-controls";

export default function TemplatesTable({
  templates,
  onDelete,
  deletingId,
}: {
  templates: TemplateSummary[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  return (
    <section
      aria-label="Templates"
      className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-1"
    >
      <div className="hidden grid-cols-[minmax(0,1fr)_9rem_10rem_10rem_3rem] items-center gap-4 border-b border-border-subtle px-5 py-3 text-xs font-medium text-text-muted md:grid">
        <span>Template</span>
        <span>Visibility</span>
        <span>Last updated</span>
        <span>Created</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-border-subtle">
        {templates.map((template) => {
          const deleting = deletingId === template.id;

          return (
            <article
              key={template.id}
              className="group/row grid gap-4 px-4 py-4 transition-colors hover:bg-surface-2 md:grid-cols-[minmax(0,1fr)_9rem_10rem_10rem_3rem] md:items-center md:px-5"
            >
              <a
                href={`/dashboard/templates/${template.id}`}
                className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-text-muted transition-colors group-hover/row:bg-accent-soft group-hover/row:text-accent">
                  <EditorIcon name="layout-template" className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-text-primary">
                    {template.title}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-xs text-text-secondary"
                    title={template.description || undefined}
                  >
                    {template.description || "No description"}
                  </span>
                </span>
              </a>

              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    template.isPrivate
                      ? "bg-surface-2 text-text-secondary"
                      : "bg-accent-soft text-accent"
                  }`}
                >
                  <EditorIcon
                    name={template.isPrivate ? "lock" : "globe"}
                    className="size-3"
                  />
                  {template.isPrivate ? "Private" : "Anyone with link"}
                </span>
              </div>

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

              <div className="flex items-center justify-end border-t border-border-subtle pt-3 md:border-0 md:pt-0">
                <EditorTooltip
                  label={deleting ? "Deleting template" : `Delete ${template.title}`}
                  align="right"
                >
                  <button
                    type="button"
                    onClick={() => onDelete(template.id)}
                    disabled={deleting}
                    aria-label={deleting ? `Deleting ${template.title}` : `Delete ${template.title}`}
                    className="inline-flex size-11 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-red-950/60 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:pointer-events-none disabled:opacity-50"
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
    <div className="flex items-center gap-2 text-xs text-text-muted">
      <EditorIcon name={icon} className="size-3.5 shrink-0 md:hidden" />
      <span className="font-medium text-text-secondary md:hidden">
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
