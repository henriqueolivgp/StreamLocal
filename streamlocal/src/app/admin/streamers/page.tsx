import { redirect } from "next/navigation";
import { db } from "@/db";
import { streamerProfiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { Card } from "@/components/ui/ui";

export default async function AdminStreamers() {
  const user = await getSessionUser().catch(() => null);
  if (!user || user.role !== "ADMIN") redirect("/login");
  const list = await db.select({ s: streamerProfiles, u: users }).from(streamerProfiles).innerJoin(users, eq(streamerProfiles.userId, users.id));
  return (
    <div className="flex flex-col gap-6 lg:flex-row"><DashboardNav user={user} />
      <div className="flex-1 space-y-3"><h1 className="text-2xl font-bold">Streamers</h1>
        {list.map(({ s, u }) => <Card key={s.id}><strong>{s.displayName}</strong><p className="text-sm text-zinc-400">{s.city} · {(s.niches ?? []).join(", ")} · {u.email} · {u.status}</p></Card>)}
      </div></div>
  );
}
