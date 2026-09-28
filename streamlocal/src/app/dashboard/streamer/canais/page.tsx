import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { streamerChannels, streamerProfiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { addChannelAction } from "@/actions/profiles";
import { Field, Input, Select, Card, Button, Badge } from "@/components/ui/ui";

export default async function CanaisPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user || user.role !== "STREAMER") redirect("/login");
  const [sp] = await db.select().from(streamerProfiles).where(eq(streamerProfiles.userId, user.id));
  const chans = sp ? await db.select().from(streamerChannels).where(eq(streamerChannels.streamerProfileId, sp.id)) : [];
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DashboardNav user={user} />
      <div className="flex-1 space-y-4">
        <h1 className="text-2xl font-bold">Canais</h1>
        <div className="grid gap-3">{chans.map((c) => <Card key={c.id}><p className="font-medium">{c.channelName} <Badge tone="blue">{c.platform}</Badge></p><a href={c.channelUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-300 underline">{c.channelUrl}</a></Card>)}</div>
        <Card><h2 className="font-semibold">Adicionar canal</h2>
          <form action={async (f) => { "use server"; await addChannelAction(f); }} className="mt-3 grid gap-3 md:grid-cols-3">
            <Field label="Plataforma"><Select name="platform" defaultValue="TWITCH"><option>TWITCH</option><option>YOUTUBE</option><option>KICK</option><option>TIKTOK</option></Select></Field>
            <Field label="Nome"><Input name="channelName" required /></Field>
            <Field label="URL"><Input name="channelUrl" required placeholder="https://…" /></Field>
            <div className="md:col-span-3"><Button type="submit">Adicionar</Button></div>
          </form></Card>
      </div>
    </div>
  );
}
