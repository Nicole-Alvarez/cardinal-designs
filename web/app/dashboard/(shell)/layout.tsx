import { redirect } from "next/navigation";
import AppShell from "@/components/dashboard/app-shell";
import { getServerUser } from "@/lib/auth";
import { toRole } from "@/lib/roles";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell user={{ ...user, role: toRole(user.role) }}>{children}</AppShell>
  );
}
