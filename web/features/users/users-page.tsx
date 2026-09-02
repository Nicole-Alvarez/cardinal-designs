"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

interface User { id: string; username: string; name: string | null; role: string; status: string; createdAt: string; updatedAt: string; }

export default function UsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (q = "") => { setError(null); try { const data = await apiFetch(`/api/users${q ? `?q=${encodeURIComponent(q)}` : ""}`, { credentials: "include" }); setUsers(data.users ?? []); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load users"); setUsers(null); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <div className="mx-auto w-full max-w-6xl space-y-6"><header className="border-b border-border-subtle pb-6"><h1 className="text-2xl font-semibold text-text-primary">Users</h1><p className="mt-1 text-sm text-text-secondary">Manage account limits and feature access.</p></header><form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void load(query); }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" className="min-h-11 flex-1 rounded-lg border border-border-strong bg-surface-1 px-3 text-text-primary"/><Button type="submit" variant="secondary">Search</Button></form>{error ? <div role="alert" className="rounded-xl bg-red-950/40 p-4 text-red-300">{error}</div> : users === null ? <div role="status" className="rounded-xl bg-surface-1 p-6 text-text-secondary">Loading users…</div> : <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-1"><table className="w-full text-left text-sm"><thead className="bg-surface-2 text-text-secondary"><tr><th className="p-4">Name</th><th className="p-4">Username</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4"/></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-t border-border-subtle"><td className="p-4">{user.name ?? "—"}</td><td className="p-4">{user.username}</td><td className="p-4 capitalize">{user.role}</td><td className="p-4 capitalize">{user.status}</td><td className="p-4 text-right"><Link className="text-accent hover:underline" href={`/dashboard/users/${user.id}`}>Manage</Link></td></tr>)}{users.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-text-secondary">No users found.</td></tr> : null}</tbody></table></div>}</div>;
}
