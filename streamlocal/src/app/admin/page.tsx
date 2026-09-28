import { redirect } from "next/navigation";
import { count, desc } from "drizzle-orm";
import { db } from "@/db";
import { applications, auditLogs, brandProfiles, campaigns, streamerProfiles, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { Card } from "@/components/ui/ui";

export default async function AdminHome() {
  const user = await getSessionUser().catch(() => null);
  if (!user || user.role !== "ADMIN") redirect("/login");
  const [u] = await db.select({ n: count() }).from(users);
  const [cp] = await db.select({ n: count() }).from(campaigns);
  const [ap] = await db.select({ n: count() }).from(applications);
  const [bp] = await db.select({ n: count() }).from(brandProfiles);
  const [sp] = await db.select({ n: count() }).from(streamerProfiles);
  const recent = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(8);
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DashboardNav user={user} />
      <div className="flex-1 space-y-4">
        <h1 className="text-2xl font-bold">Painel do administrador</h1>
        <div className="grid gap-3 md:grid-cols-5">
          <Card><p className="text-xs text-zinc-500">Utilizadores</p><p className="text-2xl font-bold">{u.n}</p></Card>
          <Card><p className="text-xs text-zinc-500">Marcas</p><p className="text-2xl font-bold">{bp.n}</p></Card>
          <Card><p className="text-xs text-zinc-500">Streamers</p><p className="text-2xl font-bold">{sp.n}</p></Card>
          <Card><p className="text-xs text-zinc-500">Campanhas</p><p className="text-2xl font-bold">{cp.n}</p></Card>
          <Card><p className="text-xs text-zinc-500">Candidaturas</p><p className="text-2xl font-bold">{ap.n}</p></Card>
        </div>
        <Card><h2 className="font-semibold">Atividade recente</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">{recent.map((r) => <li key={r.id}>· {r.action} — {r.entityType}/{r.entityId}</li>)}</ul></Card>
      </div>
    </div>
  );
}
