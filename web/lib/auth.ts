import { cache } from "react";
import { cookies } from "next/headers";

const SESSION_COOKIE = "cardinal_session";

export interface SessionUser {
  id: string;
  username: string;
  name: string | null;
  role: string;
}

export const getServerUser = cache(async function getServerUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${apiUrl}/api/auth/me`, {
      headers: { Cookie: `${SESSION_COOKIE}=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
});
