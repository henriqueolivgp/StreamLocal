import { and, desc, eq, gte, ilike } from "drizzle-orm";
import { db } from "@/db";
import { brandProfiles, campaigns } from "@/db/schema";
import { CampaignCard } from "@/components/campaigns/cards";
import { Field, Input, Select, Button, Empty } from "@/components/ui/ui";

export default async function CampanhasPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const q = searchParams.q ?? "";
  const platform = searchParams.platform ?? "";
  const cidade = searchParams.cidade ?? "";
  const objetivo = searchParams.objetivo ?? "";
  const maxEur = searchParams.maxEur ? Number(searchParams.maxEur) : undefined;

  const conds = [eq(campaigns.status, "PUBLISHED" as const)];
  if (q) conds.push(ilike(campaigns.title, `%${q}%`));
  if (objetivo) conds.push(eq(campaigns.campaignObjective, objetivo as never));
  if (typeof maxEur === "number" && !Number.isNaN(maxEur)) conds.push(gte(campaigns.budgetCents, 0));
  const rows = await db.select({ c: campaigns, b: brandProfiles })
    .from(campaigns).innerJoin(brandProfiles, eq(campaigns.brandProfileId, brandProfiles.id))
    .where(and(...conds)).orderBy(desc(campaigns.publishedAt)).limit(50);
  let list = rows;
  if (platform) list = list.filter((r) => (r.c.platforms ?? []).includes(platform));
  if (cidade) list = list.filter((r) => (r.c.targetCities ?? []).map((x) => x.toLowerCase()).some((x) => x.includes(cidade.toLowerCase())));
  if (typeof maxEur === "number" && !Number.isNaN(maxEur)) list = list.filter((r) => r.c.budgetCents <= maxEur * 100);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Descobrir campanhas</h1><p className="text-sm text-zinc-400">Campanhas publicadas por marcas portuguesas. Precisas de conta de streamer aprovada para te candidatares.</p></div>
      <form method="get" className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 md:grid-cols-5">
        <Field label="Pesquisa"><Input name="q" defaultValue={q} placeholder="Título…" /></Field>
        <Field label="Plataforma"><Select name="platform" defaultValue={platform}><option value="">Todas</option><option>TWITCH</option><option>YOUTUBE</option><option>KICK</option><option>TIKTOK</option></Select></Field>
        <Field label="Cidade"><Input name="cidade" defaultValue={cidade} placeholder="Porto…" /></Field>
        <Field label="Objetivo"><Select name="objetivo" defaultValue={objetivo}><option value="">Todos</option><option value="AWARENESS">Notoriedade</option><option value="COUPON_SALES">Vendas com cupão</option><option value="WEBSITE_TRAFFIC">Tráfego web</option><option value="LOCAL_VISITS">Visitas locais</option><option value="EVENT_ATTENDANCE">Evento</option><option value="APP_DOWNLOADS">App</option></Select></Field>
        <div className="flex items-end"><Button type="submit" className="w-full">Filtrar</Button></div>
      </form>
      {list.length === 0 ? <Empty title="Sem campanhas publicadas." hint="Volta mais tarde ou ajusta os filtros." /> : (
        <div className="grid gap-4 md:grid-cols-2">{list.map((r) => <CampaignCard key={r.c.id} c={r.c} brandName={r.b.companyName} />)}</div>
      )}
    </div>
  );
}
