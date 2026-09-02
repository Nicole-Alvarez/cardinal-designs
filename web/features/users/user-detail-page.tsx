"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type Configuration = { version: number; templateLimit: number; canvasLimitPerTemplate: number; canUseGenerateAI: boolean; metadataEnabled: boolean; canDownloadAssets: boolean };
const initial: Configuration = { version: 1, templateLimit: 5, canvasLimitPerTemplate: 2, canUseGenerateAI: false, metadataEnabled: true, canDownloadAssets: false };

export default function UserDetailPage({ userId }: { userId: string }) {
  const [configuration, setConfiguration] = useState(initial);
  const [name, setName] = useState("User");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { void apiFetch(`/api/users/${userId}`, { credentials: "include" }).then((data) => { setName(data.user.name ?? data.user.username); setConfiguration(data.configuration); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load user")); }, [userId]);
  async function save() { setSaving(true); setError(null); try { const data = await apiFetch(`/api/users/${userId}/configuration`, { method: "PUT", credentials: "include", body: JSON.stringify(configuration) }); setConfiguration(data.configuration); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save configuration"); } finally { setSaving(false); } }
  const setNumber = (key: "templateLimit" | "canvasLimitPerTemplate", value: string) => setConfiguration((current) => ({ ...current, [key]: Number(value) }));
  const toggle = (key: "canUseGenerateAI" | "metadataEnabled" | "canDownloadAssets") => setConfiguration((current) => ({ ...current, [key]: !current[key] }));
  return <div className="mx-auto w-full max-w-3xl space-y-6"><Link href="/dashboard/users" className="text-sm text-accent hover:underline">← Users</Link><header><h1 className="text-2xl font-semibold text-text-primary">{name}</h1><p className="mt-1 text-sm text-text-secondary">Limits and feature access apply on the user’s next request.</p></header>{error ? <p role="alert" className="rounded-lg bg-red-950/40 p-3 text-sm text-red-300">{error}</p> : null}<section className="space-y-5 rounded-xl border border-border-subtle bg-surface-1 p-5"><h2 className="font-semibold text-text-primary">Configuration</h2><label className="block text-sm text-text-secondary">Template limit<input min="0" max="1000" type="number" value={configuration.templateLimit} onChange={(event) => setNumber("templateLimit", event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-border-strong bg-surface-0 px-3 text-text-primary"/></label><label className="block text-sm text-text-secondary">Canvas limit per template<input min="0" max="100" type="number" value={configuration.canvasLimitPerTemplate} onChange={(event) => setNumber("canvasLimitPerTemplate", event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-border-strong bg-surface-0 px-3 text-text-primary"/></label>{([['canUseGenerateAI','Can use Generate with AI'], ['metadataEnabled','Metadata feature enabled'], ['canDownloadAssets','Can download assets']] as const).map(([key,label]) => <label key={key} className="flex items-center justify-between gap-4 text-sm text-text-primary"><span>{label}</span><input type="checkbox" role="switch" checked={configuration[key]} onChange={() => toggle(key)} /></label>)}<Button type="button" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button></section></div>;
}
