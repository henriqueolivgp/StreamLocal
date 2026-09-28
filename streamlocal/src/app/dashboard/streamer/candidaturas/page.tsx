import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, campaigns, streamerProfiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { Empty } from "@/components/ui/ui";
import { StatusBadge } from "@/components/campaigns/cards";

export default async function MinhasCandidaturas() {
  const user = await getSessionUser().catch(() => null);
  if (!user || user.role !== "STREAMER") redirect("/login");
  const [sp] = await db.select().from(streamerProfiles).where(eq(streamerProfiles.userId, user.id));
  const apps = sp ? await db.select({ a: applications, c: campaigns }).from(applications)
    .innerJoin(campaigns, eq(applications.campaignId, campaigns.id))
    .where(eq(applications.streamerProfileId, sp.id)).orderBy(desc(applications.appliedAt)) : [];
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DashboardNav user={user} />
      <div className="flex-1 space-y-3">
        <h1 className="text-2xl font-bold">Candidaturas</h1>
        {apps.length === 0 ? <Empty title="Sem candidaturas." /> : apps.map(({ a, c }) => (
          <Link key={a.id} href={`/dashboard/streamer/candidaturas/${a.id}`} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 hover:border-violet-700">
            <span><strong>{c.title}</strong></span><StatusBadge status={a.status} />
          </Link>))}
      </div>
    </div>
  );
}
