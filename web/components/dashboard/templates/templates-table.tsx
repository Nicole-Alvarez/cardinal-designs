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
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-6 py-3 font-medium">Title</th>
            <th className="px-6 py-3 font-medium">Updated</th>
            <th className="px-6 py-3 font-medium">Created</th>
            <th className="px-6 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr
              key={template.id}
              className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800"
            >
              <td className="px-6 py-3">
                <a
                  href={`/dashboard/templates/${template.id}`}
                  className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                >
                  {template.title}
                </a>
              </td>
              <td className="px-6 py-3 text-zinc-500 dark:text-zinc-400">
                {new Date(template.updatedAt).toLocaleString()}
              </td>
              <td className="px-6 py-3 text-zinc-500 dark:text-zinc-400">
                {new Date(template.createdAt).toLocaleString()}
              </td>
              <td className="px-6 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onDelete(template.id)}
                  disabled={deletingId === template.id}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                >
                  {deletingId === template.id ? "Deleting..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
