import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function DashboardIndex() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "BRAND") redirect("/dashboard/marca");
  redirect("/dashboard/streamer");
}
