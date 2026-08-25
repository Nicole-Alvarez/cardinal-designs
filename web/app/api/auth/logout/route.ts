import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const SESSION_COOKIE = "cardinal_session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {},
  }).catch(() => {});

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
