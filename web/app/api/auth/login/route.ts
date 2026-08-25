import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const SESSION_COOKIE = "cardinal_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  if (typeof data.token !== "string" || data.token.length === 0) {
    return NextResponse.json({ error: "Login service returned no session" }, { status: 502 });
  }

  const response = NextResponse.json({ user: data.user });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(SESSION_COOKIE, data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    priority: "high",
  });

  return response;
}
