import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";
import { cookies } from "next/headers";

const SESSION_COOKIE = "cardinal_session";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  let user: { username: string; name: string | null } | null = null;

  if (token) {
    try {
      const res = await fetch(`${apiUrl}/api/auth/me`, {
        headers: { Cookie: `${SESSION_COOKIE}=${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        user = data.user;
      }
    } catch {
      // fall through to redirect
    }
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight">cardinal-designs</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Welcome, {user.name ?? user.username}. You are signed in.
        </p>
        <div className="mt-8 flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}