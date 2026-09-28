import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { Card, Button, Badge } from "@/components/ui/ui";
import { adminSetUserStatusAction } from "@/actions/profiles";

export default async function AdminUsers() {
  const user = await getSessionUser().catch(() => null);
  if (!user || user.role !== "ADMIN") redirect("/login");
  const list = await db.select().from(users).orderBy(desc(users.createdAt)).limit(100);
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DashboardNav user={user} />
      <div className="flex-1 space-y-3">
        <h1 className="text-2xl font-bold">Utilizadores</h1>
        {list.map((u) => (
          <Card key={u.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span><strong>{u.name}</strong> <span className="text-sm text-zinc-500">{u.email}</span> <Badge>{u.role}</Badge> <Badge tone={u.status === "APPROVED" ? "green" : "amber"}>{u.status}</Badge></span>
              <span className="flex gap-2">
                <form action={async () => { "use server"; await adminSetUserStatusAction(u.id, "APPROVED"); }}><Button variant="outline" type="submit">Aprovar</Button></form>
                <form action={async () => { "use server"; await adminSetUserStatusAction(u.id, "SUSPENDED"); }}><Button variant="danger" type="submit">Suspender</Button></form>
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
