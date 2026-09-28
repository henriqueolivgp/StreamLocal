import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationDeliverables, applications, campaigns, streamerProfiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { Card, Empty } from "@/components/ui/ui";
import { StatusBadge } from "@/components/campaigns/cards";

export default async function StreamerResumo() {
  const user = await getSessionUser().catch(() => null);
  if (!user || user.role !== "STREAMER") redirect("/login");
  const [sp] = await db.select().from(streamerProfiles).where(eq(streamerProfiles.userId, user.id));
  if (!sp) return <p>Sem perfil.</p>;
  const apps = sp ? await db.select({ a: applications, c: campaigns }).from(applications)
    .innerJoin(campaigns, eq(applications.campaignId, campaigns.id))
    .where(eq(applications.streamerProfileId, sp.id)).orderBy(desc(applications.appliedAt)) : [];
  const pendDelivs = apps.length ? (await db.select().from(applicationDeliverables).limit(100)).filter((d) => ["PENDING", "IN_PROGRESS", "REVISION_REQUESTED"].includes(d.status)) : [];
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DashboardNav user={user} />
      <div className="flex-1 space-y-4">
        <h1 className="text-2xl font-bold">Olá, {sp.displayName}</h1>
        <div className="grid gap-3 md:grid-cols-3">
          <Card><p className="text-xs text-zinc-500">Candidaturas</p><p className="text-2xl font-bold">{apps.length}</p></Card>
          <Card><p className="text-xs text-zinc-500">Em curso (aceites)</p><p className="text-2xl font-bold">{apps.filter((x) => x.a.status === "ACCEPTED").length}</p></Card>
          <Card><p className="text-xs text-zinc-500">Entregáveis pendentes</p><p className="text-2xl font-bold">{pendDelivs.length}</p></Card>
        </div>
        {apps.length === 0 ? <Empty title="Ainda sem candidaturas." hint="Descobre campanhas publicadas e candidata-te." /> : (
          <div className="space-y-2">{apps.slice(0, 8).map(({ a, c }) => (
            <Link key={a.id} href={`/dashboard/streamer/candidaturas/${a.id}`} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 hover:border-violet-700">
              <span><strong>{c.title}</strong></span><StatusBadge status={a.status} />
            </Link>))}</div>
        )}
      </div>
    </div>
  );
}
