import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { brandProfiles, campaigns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { Card, Button } from "@/components/ui/ui";
import { StatusBadge } from "@/components/campaigns/cards";
import { setCampaignStatusAction } from "@/actions/campaigns";

export default async function AdminCampanhas() {
  const user = await getSessionUser().catch(() => null);
  if (!user || user.role !== "ADMIN") redirect("/login");
  const list = await db.select({ c: campaigns, b: brandProfiles }).from(campaigns)
    .innerJoin(brandProfiles, eq(campaigns.brandProfileId, brandProfiles.id)).orderBy(desc(campaigns.updatedAt)).limit(100);
  return (
    <div className="flex flex-col gap-6 lg:flex-row"><DashboardNav user={user} />
      <div className="flex-1 space-y-3"><h1 className="text-2xl font-bold">Campanhas</h1>
        {list.map(({ c, b }) => (
          <Card key={c.id}>
            <div className="flex flex-wrap items-center justify-between gap-2"><span><strong>{c.title}</strong> <span className="text-sm text-zinc-500">{b.companyName}</span></span><StatusBadge status={c.status} /></div>
            <div className="mt-2 flex flex-wrap gap-2">
              <form action={async () => { "use server"; await setCampaignStatusAction(c.id, "PUBLISHED"); }}><Button type="submit">Publicar</Button></form>
              <form action={async () => { "use server"; await setCampaignStatusAction(c.id, "REJECTED"); }}><Button variant="danger" type="submit">Rejeitar</Button></form>
              <form action={async () => { "use server"; await setCampaignStatusAction(c.id, "ARCHIVED"); }}><Button variant="outline" type="submit">Arquivar</Button></form>
            </div>
          </Card>))}
      </div></div>
  );
}
