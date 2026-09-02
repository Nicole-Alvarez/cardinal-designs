import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { toRole } from "@/lib/roles";
import UsersPage from "@/features/users/users-page";

export default async function Page() {
  const user = await getServerUser();
  if (!user || toRole(user.role) !== "admin") redirect("/dashboard");
  return <UsersPage />;
}
