export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return data;
}

export function apiUrl(path: string) {
  return path;
}

/** Multipart upload; lets the browser set the multipart Content-Type itself. */
export async function apiUpload<T = unknown>(path: string, file: File): Promise<T> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(path, {
    method: "POST",
    body,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return data;
}
