import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationDeliverables, applications, brandProfiles, campaignDeliverables, campaigns, streamerProfiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { Card, Button, Field, Input, Textarea, Badge } from "@/components/ui/ui";
import { StatusBadge } from "@/components/campaigns/cards";
import { submitEvidenceAction } from "@/actions/campaigns";

export default async function CandidaturaDetalhe({ params }: { params: { id: string } }) {
  const user = await getSessionUser().catch(() => null);
  if (!user || user.role !== "STREAMER") redirect("/login");
  const [app] = await db.select().from(applications).where(eq(applications.id, params.id));
  if (!app) notFound();
  const [sp] = await db.select().from(streamerProfiles).where(eq(streamerProfiles.userId, user.id));
  if (!sp || sp.id !== app.streamerProfileId) notFound();
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, app.campaignId));
  const [b] = await db.select().from(brandProfiles).where(eq(brandProfiles.id, c.brandProfileId));
  const delivs = await db.select({ ad: applicationDeliverables, cd: campaignDeliverables }).from(applicationDeliverables)
    .innerJoin(campaignDeliverables, eq(applicationDeliverables.campaignDeliverableId, campaignDeliverables.id))
    .where(eq(applicationDeliverables.applicationId, app.id));
  const accepted = app.status === "ACCEPTED";

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DashboardNav user={user} />
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-2"><h1 className="text-2xl font-bold">{c.title}</h1><StatusBadge status={app.status} /></div>
        <Card><p className="text-sm text-zinc-400">Marca: {b.companyName}</p>
          {accepted ? <div className="mt-2 text-sm"><p className="font-semibold">Briefing</p><p className="whitespace-pre-line text-zinc-300">{c.briefing || "—"}</p>
            {c.couponCode ? <p className="mt-2 font-mono text-emerald-300">Cupão: {c.couponCode}</p> : null}
            {app.overlayToken ? <p className="mt-2">Overlay OBS: <Link className="text-violet-300 underline" href={`/overlay/${app.overlayToken}`}>/overlay/{app.overlayToken.slice(0, 12)}…</Link><span className="ml-2 text-xs text-zinc-500">Cola este URL como Browser Source no OBS.</span></p> : null}
          </div> : <p className="mt-2 text-sm text-zinc-500">O briefing e o overlay ficam disponíveis após aceitação.</p>}
        </Card>
        <Card><h2 className="font-semibold">Entregáveis ({delivs.length || "a criar após aceite"})</h2>
          <div className="mt-2 space-y-3">{delivs.map(({ ad, cd }) => (
            <div key={ad.id} className="rounded-lg bg-zinc-950 p-3 text-sm">
              <div className="flex items-center justify-between"><strong>{cd.title}</strong><Badge>{ad.status}</Badge></div>
              {ad.reviewerNote ? <p className="mt-1 text-amber-300">Nota da marca: {ad.reviewerNote}</p> : null}
              {ad.evidenceUrl ? <a className="text-violet-300 underline" href={ad.evidenceUrl} target="_blank" rel="noopener noreferrer">{ad.evidenceUrl}</a> : null}
              {ad.evidenceNote ? <p className="text-zinc-400">{ad.evidenceNote}</p> : null}
              <form action={async (f) => { "use server"; await submitEvidenceAction(ad.id, f); }} className="mt-2 grid gap-2 md:grid-cols-2">
                <Field label="URL de evidência"><Input name="evidenceUrl" defaultValue={ad.evidenceUrl ?? ""} placeholder="https://…" /></Field>
                <Field label="Nota"><Input name="evidenceNote" defaultValue={ad.evidenceNote ?? ""} placeholder="Ex.: visível das 21h às 21h30" /></Field>
                <div className="md:col-span-2"><Button type="submit" variant="outline">Submeter evidência</Button></div>
              </form>
            </div>))}</div></Card>
      </div>
    </div>
  );
}
