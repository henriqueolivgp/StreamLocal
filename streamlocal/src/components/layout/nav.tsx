import Link from "next/link";
import { Radio, LayoutDashboard, Megaphone, User, Settings, ShieldCheck, Clapperboard, Wallet, Inbox, LogOut } from "lucide-react";
import type { User as U } from "@/db/schema";
import { logoutAction } from "@/actions/auth";

export function SiteHeader({ user }: { user: U | null }) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold" aria-label="StreamLocal início">
          <span className="grid size-8 place-items-center rounded-lg bg-violet-600"><Radio className="size-5 text-white" /></span>
          StreamLocal
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/campanhas" className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800">Campanhas</Link>
          {user ? <>
            <Link href="/dashboard" className="rounded-lg bg-violet-600 px-3 py-2 text-white hover:bg-violet-500">Dashboard</Link>
            <form action={logoutAction}>
              <button type="submit" aria-label="Terminar sessão" className="focus-visible-ring flex items-center gap-1.5 rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                <LogOut className="size-4" />Sair
              </button>
            </form>
          </>
          : <><Link href="/login" className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800">Entrar</Link>
          <Link href="/registar" className="rounded-lg bg-violet-600 px-3 py-2 text-white hover:bg-violet-500">Criar conta</Link></>}
        </nav>
      </div>
    </header>
  );
}

export function DashboardNav({ user }: { user: U }) {
  const links: { href: string; label: string; icon: React.ReactNode }[] =
    user.role === "BRAND" ? [
      { href: "/dashboard/marca", label: "Resumo", icon: <LayoutDashboard className="size-4" /> },
      { href: "/dashboard/marca/campanhas", label: "Campanhas", icon: <Megaphone className="size-4" /> },
      { href: "/dashboard/perfil", label: "Perfil", icon: <User className="size-4" /> },
      { href: "/dashboard/definicoes", label: "Definições", icon: <Settings className="size-4" /> },
    ] : user.role === "STREAMER" ? [
      { href: "/dashboard/streamer", label: "Resumo", icon: <LayoutDashboard className="size-4" /> },
      { href: "/campanhas", label: "Descobrir", icon: <Clapperboard className="size-4" /> },
      { href: "/dashboard/streamer/candidaturas", label: "Candidaturas", icon: <Inbox className="size-4" /> },
      { href: "/dashboard/streamer/canais", label: "Canais", icon: <Radio className="size-4" /> },
      { href: "/dashboard/streamer/ofertas", label: "Ofertas", icon: <Wallet className="size-4" /> },
      { href: "/dashboard/perfil", label: "Perfil", icon: <User className="size-4" /> },
    ] : [
      { href: "/admin", label: "Painel", icon: <ShieldCheck className="size-4" /> },
      { href: "/admin/campanhas", label: "Campanhas", icon: <Megaphone className="size-4" /> },
      { href: "/admin/utilizadores", label: "Utilizadores", icon: <User className="size-4" /> },
      { href: "/admin/marcas", label: "Marcas", icon: <User className="size-4" /> },
      { href: "/admin/streamers", label: "Streamers", icon: <Clapperboard className="size-4" /> },
      { href: "/admin/audit", label: "Auditoria", icon: <Settings className="size-4" /> },
    ];
  return (
    <nav aria-label="Navegação do painel" className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 lg:w-60 lg:flex-col">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white">
          {l.icon}{l.label}
        </Link>
      ))}
      <form action={logoutAction} className="lg:mt-2 lg:border-t lg:border-zinc-800 lg:pt-2">
        <button type="submit" aria-label="Terminar sessão" className="focus-visible-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white">
          <LogOut className="size-4" />Sair
        </button>
      </form>
    </nav>
  );
}
