import { classifyImageSource } from "@/features/templates/image-source";

const MESSAGES = {
  portable: "Portable image link. It will remain available in copied code.",
  "project-only": "Project-only image. Re-upload it before copying this template.",
  temporary: "Temporary browser image. Upload it before copying this template.",
  invalid: "Invalid image source. Use an HTTPS image URL or upload a file.",
} as const;

export default function ImageSourceNotice({ source }: { source: string }) {
  const kind = classifyImageSource(source);
  if (kind === "empty") return null;
  const portable = kind === "portable";

  return (
    <p
      role={portable ? "status" : "alert"}
      className={
        "text-xs leading-5 " +
        (portable
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-amber-700 dark:text-amber-400")
      }
    >
      {MESSAGES[kind]}
    </p>
  );
}
