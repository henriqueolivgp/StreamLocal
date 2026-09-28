import { loginAction } from "@/actions/auth";
import { Field, Input, Card, Button } from "@/components/ui/ui";
import Link from "next/link";

export default function LoginPage({ searchParams }: { searchParams?: { erro?: string } }) {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Iniciar sessão</h1>
      <p className="mt-1 text-sm text-zinc-400">Acede ao teu painel de marca, streamer ou admin.</p>
      <Card className="mt-6">
        <form action={async (f) => { "use server"; await loginAction(f); }} className="space-y-4">
          <Field label="Email"><Input name="email" type="email" required autoComplete="email" placeholder="tu@exemplo.pt" /></Field>
          <Field label="Palavra-passe"><Input name="password" type="password" required autoComplete="current-password" /></Field>
          <Button type="submit" className="w-full">Entrar</Button>
        </form>
        <p className="mt-4 text-sm text-zinc-400">Sem conta? <Link href="/registar" className="text-violet-300 hover:underline">Registar</Link></p>
        <details className="mt-4 text-xs text-zinc-500"><summary className="cursor-pointer">Contas de demonstração</summary>
          <ul className="mt-2 space-y-1 font-mono"><li>admin@streamlocal.test / Admin123!</li><li>marca@pixelportugal.test / Marca123!</li><li>streamer@rafaelplays.test / Streamer123!</li></ul>
        </details>
      </Card>
    </div>
  );
}
