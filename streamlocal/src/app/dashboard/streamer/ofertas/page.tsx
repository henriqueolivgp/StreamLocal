import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { streamerOffers, streamerProfiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { addOfferAction } from "@/actions/profiles";
import { Field, Input, Textarea, Select, Card, Button } from "@/components/ui/ui";
import { eur } from "@/lib/utils";

export default async function OfertasPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user || user.role !== "STREAMER") redirect("/login");
  const [sp] = await db.select().from(streamerProfiles).where(eq(streamerProfiles.userId, user.id));
  const offers = sp ? await db.select().from(streamerOffers).where(eq(streamerOffers.streamerProfileId, sp.id)) : [];
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DashboardNav user={user} />
      <div className="flex-1 space-y-4">
        <h1 className="text-2xl font-bold">Formatos e preços</h1>
        <div className="grid gap-3 md:grid-cols-2">{offers.map((o) => <Card key={o.id}><p className="font-medium">{o.title}</p><p className="text-sm text-zinc-400">{o.description}</p><p className="mt-1 text-violet-300 font-bold">{eur(o.basePriceCents)} · {o.format}</p></Card>)}</div>
        <Card><h2 className="font-semibold">Nova oferta</h2>
          <form action={async (f) => { "use server"; await addOfferAction(f); }} className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Título"><Input name="title" required /></Field>
            <Field label="Formato"><Select name="format" defaultValue="LIVE_MENTION"><option value="LIVE_MENTION">Menção em live</option><option value="OBS_OVERLAY">Overlay OBS</option><option value="PROMO_CODE">Código promo</option><option value="GIVEAWAY">Giveaway</option><option value="UNBOXING">Unboxing</option><option value="SOCIAL_POST">Post social</option><option value="OTHER">Outro</option></Select></Field>
            <div className="md:col-span-2"><Field label="Descrição"><Textarea name="description" rows={2} /></Field></div>
            <Field label="Preço base (cêntimos)"><Input name="basePriceCents" type="number" min={0} defaultValue={2500} required /></Field>
            <Field label="Duração est. (min)"><Input name="estimatedDurationMinutes" type="number" min={1} /></Field>
            <div className="md:col-span-2"><Button type="submit">Adicionar</Button></div>
          </form></Card>
      </div>
    </div>
  );
}
