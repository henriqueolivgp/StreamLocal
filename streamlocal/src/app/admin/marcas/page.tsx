import { redirect } from "next/navigation";
import { db } from "@/db";
import { brandProfiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { Card } from "@/components/ui/ui";

export default async function AdminMarcas() {
  const user = await getSessionUser().catch(() => null);
  if (!user || user.role !== "ADMIN") redirect("/login");
  const list = await db.select({ b: brandProfiles, u: users }).from(brandProfiles).innerJoin(users, eq(brandProfiles.userId, users.id));
  return (
    <div className="flex flex-col gap-6 lg:flex-row"><DashboardNav user={user} />
      <div className="flex-1 space-y-3"><h1 className="text-2xl font-bold">Marcas</h1>
        {list.map(({ b, u }) => <Card key={b.id}><strong>{b.companyName}</strong><p className="text-sm text-zinc-400">{b.city} · {b.category} · {u.email} · {u.status}</p></Card>)}
      </div></div>
  );
}
