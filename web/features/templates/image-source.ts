export type ImageSourceKind =
  | "empty"
  | "portable"
  | "project-only"
  | "temporary"
  | "invalid";

export function classifyImageSource(source: string): ImageSourceKind {
  const value = source.trim();
  if (!value) return "empty";
  if (value.startsWith("blob:")) return "temporary";
  if (value.startsWith("data:image/")) return "portable";
  if (value.startsWith("/") || value.startsWith("./") || value.startsWith("../")) {
    return "project-only";
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "invalid";
    if (url.hostname.endsWith(".private.blob.vercel-storage.com")) {
      return "project-only";
    }
    return "portable";
  } catch {
    return "invalid";
  }
}
