import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { toRole } from "@/lib/roles";
import UserDetailPage from "@/features/users/user-detail-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const user = await getServerUser(); if (!user || toRole(user.role) !== "admin") redirect("/dashboard"); const { id } = await params; return <UserDetailPage userId={id} />; }
