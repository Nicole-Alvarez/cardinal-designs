import { getIconSvg } from "@/features/templates/icons";

export function EditorIcon({
  name,
  className = "size-4",
}: {
  name: string;
  className?: string;
}) {
  const inner = getIconSvg(name);
  if (!inner) return null;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

export function EditorTooltip({
  label,
  children,
  align = "center",
}: {
  label: string;
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  const position =
    align === "left"
      ? "left-0"
      : align === "right"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none invisible absolute top-full z-50 mt-2 whitespace-nowrap rounded-md bg-zinc-950 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-has-[:focus-visible]/tooltip:visible group-has-[:focus-visible]/tooltip:opacity-100 dark:bg-zinc-50 dark:text-zinc-950 ${position}`}
      >
        {label}
      </span>
    </span>
  );
}
