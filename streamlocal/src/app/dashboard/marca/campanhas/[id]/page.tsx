import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, brandProfiles, campaignDeliverables, campaignEvents, campaigns, streamerProfiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { eur } from "@/lib/utils";
import { DashboardNav } from "@/components/layout/nav";
import { Card, Badge, Button } from "@/components/ui/ui";
import { StatusBadge } from "@/components/campaigns/cards";
import { decideApplicationAction, setCampaignStatusAction, submitCampaignAction } from "@/actions/campaigns";

export default async function CampanhaMarcaDetail({ params }: { params: { id: string } }) {
  const user = await getSessionUser().catch(() => null);
  if (!user || (user.role !== "BRAND" && user.role !== "ADMIN")) redirect("/login");
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, params.id));
  if (!c) notFound();
  if (user.role === "BRAND") {
    const b = (await db.select().from(brandProfiles).where(eq(brandProfiles.userId, user.id)))[0];
    if (!b || b.id !== c.brandProfileId) notFound();
  }
  const dels = await db.select().from(campaignDeliverables).where(eq(campaignDeliverables.campaignId, c.id));
  const apps = await db.select({ a: applications, s: streamerProfiles }).from(applications)
    .innerJoin(streamerProfiles, eq(applications.streamerProfileId, streamerProfiles.id))
    .where(eq(applications.campaignId, c.id));
  const events = await db.select().from(campaignEvents).where(eq(campaignEvents.campaignId, c.id));
  const counts = (t: string) => events.filter((e) => e.eventType === t).length;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DashboardNav user={user} />
      <div className="flex-1 space-y-4">
        <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold">{c.title}</h1><StatusBadge status={c.status} /></div>
        <p className="text-sm text-zinc-400">{c.shortDescription} · {eur(c.budgetCents)}</p>

        <Card><h2 className="font-semibold">Estado da campanha</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(c.status === "DRAFT" || c.status === "REJECTED") ? <form action={async () => { "use server"; await submitCampaignAction(c.id); }}><Button type="submit">Submeter para revisão</Button></form> : null}
            {c.status === "PUBLISHED" ? <form action={async () => { "use server"; await setCampaignStatusAction(c.id, "PAUSED"); }}><Button variant="outline" type="submit">Pausar</Button></form> : null}
            {c.status === "PAUSED" ? <form action={async () => { "use server"; await setCampaignStatusAction(c.id, "PUBLISHED"); }}><Button type="submit">Republicar</Button></form> : null}
            {["MATCHED", "ACTIVE"].includes(c.status) ? <form action={async () => { "use server"; await setCampaignStatusAction(c.id, "COMPLETED"); }}><Button type="submit">Concluir</Button></form> : null}
            <form action={async () => { "use server"; await setCampaignStatusAction(c.id, "ARCHIVED"); }}><Button variant="ghost" type="submit">Arquivar</Button></form>
            <Link href={`/dashboard/marca/campanhas/${c.id}/candidaturas`} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm">Gerir candidaturas ({apps.length})</Link>
          </div></Card>

        <Card><h2 className="font-semibold">Relatório — Métricas da plataforma StreamLocal</h2>
          <p className="text-xs text-zinc-500">Não são métricas oficiais da Twitch/YouTube.</p>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
            <div className="rounded-lg bg-zinc-950 p-3"><p className="text-xs text-zinc-500">Candidaturas</p><p className="text-xl font-bold">{apps.length}</p></div>
            <div className="rounded-lg bg-zinc-950 p-3"><p className="text-xs text-zinc-500">Aceites</p><p className="text-xl font-bold">{apps.filter((x) => x.a.status === "ACCEPTED").length}</p></div>
            <div className="rounded-lg bg-zinc-950 p-3"><p className="text-xs text-zinc-500">Views overlay</p><p className="text-xl font-bold">{counts("OVERLAY_VIEW")}</p></div>
            <div className="rounded-lg bg-zinc-950 p-3"><p className="text-xs text-zinc-500">QR views</p><p className="text-xl font-bold">{counts("QR_PAGE_VIEW")}</p></div>
            <div className="rounded-lg bg-zinc-950 p-3"><p className="text-xs text-zinc-500">Cliques</p><p className="text-xl font-bold">{counts("LINK_CLICK")}</p></div>
          </div>
          <h3 className="mt-4 font-medium">Streamers aceites</h3>
          <ul className="mt-1 text-sm text-zinc-300">{apps.filter((x) => x.a.status === "ACCEPTED").map((x) => <li key={x.a.id}>· {x.s.displayName} {x.a.overlayToken ? <Link className="text-violet-300 underline" href={`/overlay/${x.a.overlayToken}`}>ver overlay</Link> : null}</li>)}</ul>
        </Card>

        <Card><h2 className="font-semibold">Candidaturas</h2>
          <div className="mt-2 space-y-2">{apps.length === 0 ? <p className="text-sm text-zinc-500">Sem candidaturas.</p> : apps.map(({ a, s }) => (
            <div key={a.id} className="rounded-lg bg-zinc-950 p-3 text-sm">
              <div className="flex items-center justify-between"><strong>{s.displayName}</strong><StatusBadge status={a.status} /></div>
              <p className="mt-1 text-zinc-400">{a.message}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <form action={async () => { "use server"; await decideApplicationAction(a.id, "SHORTLISTED"); }}><Button variant="outline" type="submit">Shortlist</Button></form>
                <form action={async () => { "use server"; await decideApplicationAction(a.id, "ACCEPTED"); }}><Button type="submit">Aceitar</Button></form>
                <form action={async () => { "use server"; await decideApplicationAction(a.id, "REJECTED"); }}><Button variant="danger" type="submit">Recusar</Button></form>
              </div>
            </div>))}</div></Card>

        <Card><h2 className="font-semibold">Entregáveis da campanha ({dels.length})</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">{dels.map((d) => <li key={d.id}>· {d.title} <Badge>{d.type}</Badge></li>)}</ul></Card>
      </div>
    </div>
  );
}
