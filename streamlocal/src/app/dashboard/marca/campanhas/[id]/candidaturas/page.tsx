import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, brandProfiles, campaigns, streamerProfiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { Card, Button } from "@/components/ui/ui";
import { StatusBadge } from "@/components/campaigns/cards";
import { decideApplicationAction } from "@/actions/campaigns";

export default async function GerirCandidaturas({ params }: { params: { id: string } }) {
  const user = await getSessionUser().catch(() => null);
  if (!user || (user.role !== "BRAND" && user.role !== "ADMIN")) redirect("/login");
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, params.id));
  if (!c) redirect("/dashboard/marca/campanhas");
  const apps = await db.select({ a: applications, s: streamerProfiles }).from(applications)
    .innerJoin(streamerProfiles, eq(applications.streamerProfileId, streamerProfiles.id))
    .where(eq(applications.campaignId, c.id));
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DashboardNav user={user} />
      <div className="flex-1 space-y-3">
        <h1 className="text-2xl font-bold">Candidaturas · {c.title}</h1>
        {apps.map(({ a, s }) => (
          <Card key={a.id}>
            <div className="flex items-center justify-between"><strong>{s.displayName}</strong><StatusBadge status={a.status} /></div>
            <p className="mt-1 text-sm text-zinc-400">{s.bio} · {s.city} · ~{s.averageViewers ?? "?"} viewers</p>
            <p className="mt-1 text-sm">{a.message}</p>
            <div className="mt-2 flex gap-2">
              <form action={async () => { "use server"; await decideApplicationAction(a.id, "SHORTLISTED"); }}><Button variant="outline" type="submit">Shortlist</Button></form>
              <form action={async () => { "use server"; await decideApplicationAction(a.id, "ACCEPTED"); }}><Button type="submit">Aceitar</Button></form>
              <form action={async () => { "use server"; await decideApplicationAction(a.id, "REJECTED"); }}><Button variant="danger" type="submit">Recusar</Button></form>
            </div>
          </Card>
        ))}
        {apps.length === 0 ? <Card><p className="text-sm text-zinc-400">Sem candidaturas ainda.</p></Card> : null}
      </div>
    </div>
  );
}
