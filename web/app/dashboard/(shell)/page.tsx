import { redirect } from "next/navigation";
import DashboardPage from "@/features/dashboard/dashboard-page";
import { getServerUser } from "@/lib/auth";

export default async function Page() {
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }

  return <DashboardPage name={user.name ?? user.username} />;
}
