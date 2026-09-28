import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, brandProfiles, campaignDeliverables, campaigns, streamerProfiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { eur } from "@/lib/utils";
import { Badge, Card, Button, Field, Textarea, Input } from "@/components/ui/ui";
import { StatusBadge } from "@/components/campaigns/cards";
import { applyToCampaignAction } from "@/actions/campaigns";

export default async function CampanhaDetalhe({ params }: { params: { slug: string } }) {
  const rows = await db.select({ c: campaigns, b: brandProfiles }).from(campaigns)
    .innerJoin(brandProfiles, eq(campaigns.brandProfileId, brandProfiles.id))
    .where(eq(campaigns.slug, params.slug));
  const row = rows[0];
  if (!row || (row.c.status !== "PUBLISHED" && row.c.status !== "ACTIVE" && row.c.status !== "MATCHED")) notFound();
  const { c, b } = row;
  const dels = await db.select().from(campaignDeliverables).where(eq(campaignDeliverables.campaignId, c.id));
  const user = await getSessionUser().catch(() => null);
  let alreadyApplied = false;
  if (user?.role === "STREAMER") {
    const sp = await db.select().from(streamerProfiles).where(eq(streamerProfiles.userId, user.id));
    if (sp[0]) {
      const apps = await db.select().from(applications).where(and(eq(applications.campaignId, c.id), eq(applications.streamerProfileId, sp[0].id)));
      alreadyApplied = apps.length > 0;
    }
  }
  const canApply = user?.role === "STREAMER" && user.status === "APPROVED" && !alreadyApplied;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-center gap-2"><StatusBadge status={c.status} /><Badge tone="blue">{c.campaignObjective}</Badge><Badge>{c.category}</Badge></div>
        <h1 className="text-3xl font-bold">{c.title}</h1>
        <p className="text-zinc-400">{c.shortDescription}</p>
        <Card><h2 className="font-semibold">Sobre a campanha</h2><p className="mt-2 whitespace-pre-line text-sm text-zinc-300">{c.description}</p>
          <h3 className="mt-4 font-semibold">Requisitos</h3><p className="mt-1 whitespace-pre-line text-sm text-zinc-300">{c.requirements}</p></Card>
        <Card><h2 className="font-semibold">Entregáveis ({dels.length})</h2>
          <ul className="mt-2 space-y-2 text-sm text-zinc-300">{dels.map((d) => <li key={d.id} className="flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2"><span>{d.title}</span><Badge>{d.type}{d.required ? " · obrigatório" : ""}</Badge></li>)}</ul>
          <p className="mt-2 text-xs text-zinc-500">O briefing detalhado só fica visível após candidatura aceite.</p></Card>
      </div>
      <div className="space-y-4">
        <Card>
          <p className="text-sm text-zinc-500">{b.companyName} · {b.city || "Portugal"}</p>
          <p className="text-2xl font-bold text-violet-300">{eur(c.budgetCents)}</p>
          <div className="mt-2 flex flex-wrap gap-1">{(c.platforms ?? []).map((p) => <Badge key={p} tone="blue">{p}</Badge>)}</div>
          <div className="mt-2 text-xs text-zinc-500">Alvo: {(c.targetCities ?? []).join(", ") || "—"} · Nichos: {(c.targetNiches ?? []).join(", ") || "—"}</div>
          {c.couponCode ? <p className="mt-3 rounded-lg bg-zinc-950 px-3 py-2 font-mono text-sm text-emerald-300">Cupão: {c.couponCode}</p> : null}
        </Card>
        <Card>
          <h2 className="font-semibold">Candidatura</h2>
          {!user ? <p className="mt-2 text-sm text-zinc-400">Inicia sessão como streamer para te candidatares. <a href="/login" className="text-violet-300 underline">Entrar</a></p>
          : alreadyApplied ? <p className="mt-2 text-sm text-emerald-300">Já te candidataste. Acompanha em Dashboard → Candidaturas.</p>
          : !canApply ? <p className="mt-2 text-sm text-amber-300">A tua conta de streamer ainda está por aprovar.</p>
          : (
            <form action={async (f) => { "use server"; await applyToCampaignAction(c.id, f); }} className="mt-3 space-y-3">
              <Field label="Mensagem para a marca"><Textarea name="message" required minLength={10} rows={4} placeholder="Porque és a pessoa certa? Audiência, horários, ideias…" /></Field>
              <Field label="Preço proposto (€, opcional)"><Input name="priceEur" type="number" min={0} step="0.01" placeholder="Ex.: 45" /></Field>
              <Button type="submit" className="w-full">Submeter candidatura</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
