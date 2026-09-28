import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { brandProfiles, campaigns } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { Empty } from "@/components/ui/ui";
import { StatusBadge } from "@/components/campaigns/cards";
import { eur } from "@/lib/utils";

export default async function MarcaCampanhas() {
  const user = await getSessionUser().catch(() => null);
  if (!user || (user.role !== "BRAND" && user.role !== "ADMIN")) redirect("/login");
  const brand = (await db.select().from(brandProfiles).where(eq(brandProfiles.userId, user.id)))[0]
    ?? (user.role === "ADMIN" ? (await db.select().from(brandProfiles).limit(1))[0] : null);
  if (!brand) return <p>Sem perfil.</p>;
  const camps = await db.select().from(campaigns).where(eq(campaigns.brandProfileId, brand.id)).orderBy(desc(campaigns.updatedAt));
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DashboardNav user={user} />
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Campanhas</h1><Link href="/dashboard/marca/campanhas/nova" className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white">Nova campanha</Link></div>
        {camps.length === 0 ? <Empty title="Sem campanhas." /> : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800"><table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-zinc-400"><tr><th className="px-4 py-2">Título</th><th className="px-4 py-2">Estado</th><th className="px-4 py-2">Orçamento</th></tr></thead>
            <tbody>{camps.map((c) => <tr key={c.id} className="border-t border-zinc-800"><td className="px-4 py-2"><Link className="hover:underline" href={`/dashboard/marca/campanhas/${c.id}`}>{c.title}</Link></td><td className="px-4 py-2"><StatusBadge status={c.status} /></td><td className="px-4 py-2">{eur(c.budgetCents)}</td></tr>)}</tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
