export type DownloadCodeLang = "html" | "react" | "angular";

function safeBaseName(title: string): string {
  return (
    title
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "template"
  );
}

export function previewImageFileName(title: string): string {
  return `${safeBaseName(title)}.png`;
}

export function codeFileName(title: string, lang: DownloadCodeLang): string {
  const base = safeBaseName(title);
  if (lang === "react") return `${base}.tsx`;
  if (lang === "angular") return `${base}.component.ts`;
  return `${base}.html`;
}

export function downloadUrl(url: string, fileName: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function downloadTextFile(content: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  downloadUrl(url, fileName);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
