import type { Metadata } from "next";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { HeaderSwitcher } from "@/components/layout/header-switcher";

export const metadata: Metadata = {
  title: "StreamLocal — Marcas locais × Streamers portugueses",
  description: "Plataforma portuguesa que liga marcas locais a streamers para campanhas em live.",
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser().catch(() => null);
  return (
    <html lang="pt-PT" className="dark">
      <body>
        <HeaderSwitcher user={user} />
        <main className="mx-auto min-h-[80vh] max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-500">
          StreamLocal · MVP de demonstração · Dados fictícios, sem parcerias reais · Métricas apresentadas são da plataforma StreamLocal.
        </footer>
      </body>
    </html>
  );
}
