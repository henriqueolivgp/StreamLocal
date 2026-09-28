import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { DashboardNav } from "@/components/layout/nav";
import { Card, Button } from "@/components/ui/ui";

export default async function DefinicoesPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/login");
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DashboardNav user={user} />
      <div className="flex-1 space-y-4">
        <h1 className="text-2xl font-bold">Definições</h1>
        <Card><p className="text-sm text-zinc-400">Sessão iniciada como <span className="text-zinc-200">{user.email}</span> ({user.role}).</p>
          <form action={logoutAction} className="mt-4"><Button variant="outline" type="submit">Terminar sessão</Button></form></Card>
        <Card><h2 className="font-semibold">Futuro</h2><p className="text-sm text-zinc-400">Pagamentos, faturação, i18n e integrações Twitch/YouTube/Kick serão extensões aqui, sem quebrar o MVP.</p></Card>
      </div>
    </div>
  );
}
