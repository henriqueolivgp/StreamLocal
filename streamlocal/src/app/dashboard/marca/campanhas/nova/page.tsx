import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { createCampaignAction } from "@/actions/campaigns";
import { Field, Input, Textarea, Select, Card, Button } from "@/components/ui/ui";

const DELIVERABLES_DEFAULT = JSON.stringify([
  { title: "Overlay OBS 30 min", type: "OVERLAY", required: true },
  { title: "Menção com cupão", type: "PROMO_CODE", required: true },
  { title: "Clip de evidência", type: "CLIP", required: false },
]);

export default async function NovaCampanha() {
  const user = await getSessionUser().catch(() => null);
  if (!user || (user.role !== "BRAND" && user.role !== "ADMIN")) redirect("/login");
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DashboardNav user={user} />
      <div className="flex-1">
        <h1 className="text-2xl font-bold">Nova campanha</h1>
        <p className="text-sm text-zinc-400">Guarda como rascunho e depois submete para revisão.</p>
        <Card className="mt-4">
          <form action={async (f) => { "use server"; await createCampaignAction(f); }} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><Field label="Título"><Input name="title" required minLength={4} placeholder="Ex.: Noite Indie no Porto" /></Field></div>
            <div className="md:col-span-2"><Field label="Resumo"><Input name="shortDescription" required minLength={10} maxLength={300} placeholder="Uma frase para os cards" /></Field></div>
            <div className="md:col-span-2"><Field label="Descrição"><Textarea name="description" required rows={4} /></Field></div>
            <Field label="Categoria"><Input name="category" required defaultValue="gaming" /></Field>
            <Field label="Orçamento (€)"><Input name="budgetEur" type="number" min={0} step="0.01" required defaultValue={300} /></Field>
            <Field label="Objetivo"><Select name="campaignObjective" defaultValue="AWARENESS"><option value="AWARENESS">Notoriedade</option><option value="COUPON_SALES">Vendas com cupão</option><option value="WEBSITE_TRAFFIC">Tráfego web</option><option value="LOCAL_VISITS">Visitas locais</option><option value="EVENT_ATTENDANCE">Evento</option><option value="APP_DOWNLOADS">Downloads app</option><option value="OTHER">Outro</option></Select></Field>
            <Field label="Compensação"><Select name="compensationType" defaultValue="FIXED"><option value="FIXED">Fixa</option><option value="PRODUCT">Produto</option><option value="HYBRID">Híbrida</option><option value="NEGOTIABLE">Negociável</option></Select></Field>
            <div className="md:col-span-2"><Field label="Plataformas (seleciona com Ctrl/Cmd)"><Select name="platforms" multiple defaultValue={["TWITCH"]} className="h-28"><option value="TWITCH">Twitch</option><option value="YOUTUBE">YouTube Live</option><option value="KICK">Kick (futuro)</option><option value="TIKTOK">TikTok</option></Select></Field></div>
            <Field label="Nichos alvo (vírgulas)"><Input name="targetNiches" placeholder="gaming, indies" /></Field>
            <Field label="Cidades alvo"><Input name="targetCities" placeholder="Porto, Lisboa" /></Field>
            <Field label="Distritos alvo"><Input name="targetDistricts" placeholder="Porto" /></Field>
            <Field label="Mín. viewers"><Input name="minAverageViewers" type="number" min={0} /></Field>
            <Field label="Tema do overlay"><Select name="overlayTheme" defaultValue="DARK"><option value="DARK">Escuro</option><option value="LIGHT">Claro</option><option value="NEON">Neon</option></Select></Field>
            <div className="md:col-span-2"><Field label="Requisitos"><Textarea name="requirements" required rows={3} defaultValue="Stream em português, menção de parceria paga." /></Field></div>
            <div className="md:col-span-2"><Field label="Briefing privado (só visível após aceite)"><Textarea name="briefing" rows={3} /></Field></div>
            <Field label="Cupão (opcional)"><Input name="couponCode" placeholder="PORTO10" /></Field>
            <Field label="URL destino (opcional)"><Input name="destinationUrl" placeholder="https://…" /></Field>
            <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" name="qrCodeEnabled" defaultChecked className="size-4 accent-violet-600" /> Ativar QR code no overlay</label>
            <div className="md:col-span-2"><Field label="Entregáveis (JSON editável)" hint='Ex.: [{"title":"Overlay OBS 30 min","type":"OVERLAY","required":true}]'><Textarea name="deliverablesJson" rows={4} defaultValue={DELIVERABLES_DEFAULT} /></Field></div>
            <div className="md:col-span-2"><Button type="submit">Guardar como rascunho</Button></div>
          </form>
        </Card>
      </div>
    </div>
  );
}
