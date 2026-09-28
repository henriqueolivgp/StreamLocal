import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";

export default async function AdminAudit() {
  const user = await getSessionUser().catch(() => null);
  if (!user || user.role !== "ADMIN") redirect("/login");
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
  return (
    <div className="flex flex-col gap-6 lg:flex-row"><DashboardNav user={user} />
      <div className="flex-1"><h1 className="text-2xl font-bold">Auditoria</h1>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800"><table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-zinc-400"><tr><th className="px-3 py-2">Quando</th><th className="px-3 py-2">Ação</th><th className="px-3 py-2">Entidade</th><th className="px-3 py-2">ID</th></tr></thead>
          <tbody>{logs.map((l) => <tr key={l.id} className="border-t border-zinc-800"><td className="px-3 py-2">{new Date(l.createdAt).toLocaleString("pt-PT")}</td><td className="px-3 py-2">{l.action}</td><td className="px-3 py-2">{l.entityType}</td><td className="px-3 py-2 font-mono text-xs">{l.entityId.slice(0, 8)}…</td></tr>)}</tbody>
        </table></div>
      </div></div>
  );
}
