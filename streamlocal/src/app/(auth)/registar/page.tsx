import { registerAction } from "@/actions/auth";
import { Field, Input, Select, Card, Button } from "@/components/ui/ui";
import Link from "next/link";

export default function RegistarPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <p className="mt-1 text-sm text-zinc-400">Escolhe o teu papel. O perfil fica pendente até aprovação.</p>
      <Card className="mt-6">
        <form action={async (f) => { "use server"; await registerAction(f); }} className="space-y-4">
          <Field label="Nome / Nome do canal"><Input name="name" required minLength={2} placeholder="Ex.: Pixel Porto ou RafaelPlays" /></Field>
          <Field label="Email"><Input name="email" type="email" required placeholder="tu@exemplo.pt" /></Field>
          <Field label="Palavra-passe"><Input name="password" type="password" required minLength={8} placeholder="Mínimo 8 caracteres" /></Field>
          <Field label="Sou…"><Select name="role" required defaultValue="STREAMER"><option value="BRAND">Marca / Negócio local</option><option value="STREAMER">Streamer / Criador</option></Select></Field>
          <Button type="submit" className="w-full">Registar</Button>
        </form>
        <p className="mt-4 text-sm text-zinc-400">Já tens conta? <Link href="/login" className="text-violet-300 hover:underline">Entrar</Link></p>
      </Card>
    </div>
  );
}
