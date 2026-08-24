export default function DashboardPage({ name }: { name: string }) {
  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-2xl font-semibold tracking-tight">cardinal-designs</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Welcome, {name}. You are signed in.
      </p>
    </section>
  );
}
