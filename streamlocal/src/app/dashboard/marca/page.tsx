import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { applications, brandProfiles, campaigns } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { Card, Empty, Badge } from "@/components/ui/ui";
import { StatusBadge } from "@/components/campaigns/cards";
import { eur } from "@/lib/utils";

export default async function MarcaResumo() {
  const user = await getSessionUser().catch(() => null);
  if (!user || (user.role !== "BRAND" && user.role !== "ADMIN")) redirect("/login");
  const brand = (await db.select().from(brandProfiles).where(eq(brandProfiles.userId, user.id)))[0]
    ?? (user.role === "ADMIN" ? (await db.select().from(brandProfiles).limit(1))[0] : null);
  if (!brand) return <p>Sem perfil de marca.</p>;
  const camps = await db.select().from(campaigns).where(eq(campaigns.brandProfileId, brand.id)).orderBy(desc(campaigns.updatedAt));
  const ids = camps.map((c) => c.id);
  const apps = ids.length ? await db.select().from(applications).where(inArray(applications.campaignId, ids)) : [];
  const pend = apps.filter((a) => a.status === "PENDING").length;
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DashboardNav user={user} />
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Olá, {brand.companyName}</h1><Link href="/dashboard/marca/campanhas/nova" className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white">Nova campanha</Link></div>
        <div className="grid gap-3 md:grid-cols-4">
          <Card><p className="text-xs text-zinc-500">Campanhas</p><p className="text-2xl font-bold">{camps.length}</p></Card>
          <Card><p className="text-xs text-zinc-500">Ativas/publicadas</p><p className="text-2xl font-bold">{camps.filter((c) => ["PUBLISHED", "ACTIVE", "MATCHED"].includes(c.status)).length}</p></Card>
          <Card><p className="text-xs text-zinc-500">Candidaturas pendentes</p><p className="text-2xl font-bold">{pend}</p></Card>
          <Card><p className="text-xs text-zinc-500">Concluídas</p><p className="text-2xl font-bold">{camps.filter((c) => c.status === "COMPLETED").length}</p></Card>
        </div>
        {camps.length === 0 ? <Empty title="Ainda sem campanhas." hint="Cria a primeira campanha como rascunho." /> : (
          <div className="grid gap-3">{camps.slice(0, 6).map((c) => (
            <Link key={c.id} href={`/dashboard/marca/campanhas/${c.id}`} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 hover:border-violet-700">
              <span><strong>{c.title}</strong><span className="ml-2 text-sm text-zinc-500">{eur(c.budgetCents)}</span></span><StatusBadge status={c.status} />
            </Link>))}</div>
        )}
      </div>
    </div>
  );
}
