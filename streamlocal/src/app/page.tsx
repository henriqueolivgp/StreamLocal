import Link from "next/link";
import { Megaphone, Clapperboard, ShieldCheck, QrCode } from "lucide-react";
import { Card, Badge } from "@/components/ui/ui";

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="grid gap-8 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-violet-950 p-8 md:grid-cols-2 md:p-12">
        <div>
          <Badge tone="violet">MVP · Feito em Portugal</Badge>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Marcas locais.<br />Streamers reais.<br /><span className="text-violet-400">Campanhas em live.</span>
          </h1>
          <p className="mt-4 max-w-md text-zinc-400">
            A StreamLocal liga pequenos negócios portugueses a criadores de Twitch e YouTube Live para promoções pagas com overlay OBS, cupões e QR code.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/registar" className="rounded-lg bg-violet-600 px-5 py-2.5 font-medium text-white hover:bg-violet-500">Criar conta grátis</Link>
            <Link href="/campanhas" className="rounded-lg border border-zinc-700 px-5 py-2.5 text-zinc-200 hover:border-zinc-500">Ver campanhas</Link>
          </div>
        </div>
        <div className="grid gap-3">
          <Card><p className="text-sm text-zinc-400">Overlay OBS para a live</p><p className="font-mono text-lg text-emerald-300">CUPÃO PORTOINDIE10 · -10%</p><p className="text-xs text-zinc-500">Parceria paga · Conteúdo patrocinado</p></Card>
          <Card><p className="text-sm text-zinc-400">Exemplo de campanha</p><p className="font-semibold">Noite Indie no Porto — 450,00 €</p><p className="text-xs text-zinc-500">Twitch · YouTube · Porto</p></Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card><Megaphone className="mb-2 size-6 text-violet-400" /><h2 className="font-semibold">Para marcas</h2><p className="mt-1 text-sm text-zinc-400">Cria campanhas com orçamento, briefing, cupão e QR. Aprova streamers e acompanha o relatório.</p></Card>
        <Card><Clapperboard className="mb-2 size-6 text-violet-400" /><h2 className="font-semibold">Para streamers</h2><p className="mt-1 text-sm text-zinc-400">Perfil profissional, canais, preços. Candidata-te, recebe o overlay OBS e submete evidências.</p></Card>
        <Card><QrCode className="mb-2 size-6 text-violet-400" /><h2 className="font-semibold">Overlay + QR</h2><p className="mt-1 text-sm text-zinc-400">Browser Source para o OBS com branding, cupão e QR que regista visitas na plataforma.</p></Card>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <h2 className="text-xl font-bold">Como funciona</h2>
        <ol className="mt-4 grid gap-3 text-sm text-zinc-300 md:grid-cols-4">
          <li><strong>1.</strong> A marca cria a campanha e submete para revisão.</li>
          <li><strong>2.</strong> O admin aprova e a campanha é publicada.</li>
          <li><strong>3.</strong> Streamers candidatam-se; a marca aceita.</li>
          <li><strong>4.</strong> Overlay ativo, evidências e relatório simples.</li>
        </ol>
        <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500"><ShieldCheck className="size-4" /> Operação parcialmente manual no MVP: sem pagamentos automáticos nem faturas.</p>
      </section>
    </div>
  );
}
