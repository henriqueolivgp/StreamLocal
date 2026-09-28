import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { brandProfiles, streamerProfiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/nav";
import { saveBrandProfileAction, saveStreamerProfileAction } from "@/actions/profiles";
import { Field, Input, Textarea, Card, Button, Badge } from "@/components/ui/ui";

export default async function PerfilPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");
  const isBrand = user.role === "BRAND";
  const bp = isBrand ? (await db.select().from(brandProfiles).where(eq(brandProfiles.userId, user.id)))[0] : null;
  const sp = !isBrand ? (await db.select().from(streamerProfiles).where(eq(streamerProfiles.userId, user.id)))[0] : null;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DashboardNav user={user} />
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-2"><h1 className="text-2xl font-bold">Perfil</h1><Badge tone={user.status === "APPROVED" ? "green" : "amber"}>{user.status}</Badge></div>
        {user.status !== "APPROVED" ? <p className="rounded-lg border border-amber-800 bg-amber-950 px-4 py-2 text-sm text-amber-200">O teu perfil está pendente de aprovação. Para demonstração, usa as contas seed já aprovadas.</p> : null}
        {isBrand && bp ? (
          <Card><form action={async (f) => { "use server"; await saveBrandProfileAction(f); }} className="grid gap-4 md:grid-cols-2">
            <Field label="Empresa"><Input name="companyName" defaultValue={bp.companyName} required /></Field>
            <Field label="Categoria"><Input name="category" defaultValue={bp.category} required /></Field>
            <Field label="Cidade"><Input name="city" defaultValue={bp.city} required /></Field>
            <Field label="Distrito"><Input name="district" defaultValue={bp.district} required /></Field>
            <div className="md:col-span-2"><Field label="Descrição"><Textarea name="description" rows={3} defaultValue={bp.description} /></Field></div>
            <Field label="Website"><Input name="website" defaultValue={bp.website ?? ""} placeholder="https://…" /></Field>
            <Field label="Pessoa de contacto"><Input name="contactName" defaultValue={bp.contactName} required /></Field>
            <Field label="Email de contacto"><Input name="contactEmail" type="email" defaultValue={bp.contactEmail} required /></Field>
            <Field label="Telefone"><Input name="contactPhone" defaultValue={bp.contactPhone ?? ""} /></Field>
            <div className="md:col-span-2"><Button type="submit">Guardar perfil</Button></div>
          </form></Card>
        ) : sp ? (
          <Card><form action={async (f) => { "use server"; await saveStreamerProfileAction(f); }} className="grid gap-4 md:grid-cols-2">
            <Field label="Nome de criador"><Input name="displayName" defaultValue={sp.displayName} required /></Field>
            <Field label="Niches (separados por vírgula)"><Input name="niches" defaultValue={(sp.niches ?? []).join(", ")} placeholder="gaming, pokémon" /></Field>
            <Field label="Cidade"><Input name="city" defaultValue={sp.city} required /></Field>
            <Field label="Distrito"><Input name="district" defaultValue={sp.district} required /></Field>
            <Field label="Média de viewers"><Input name="averageViewers" type="number" defaultValue={sp.averageViewers ?? ""} /></Field>
            <Field label="Seguidores"><Input name="followerCount" type="number" defaultValue={sp.followerCount ?? ""} /></Field>
            <div className="md:col-span-2"><Field label="Bio"><Textarea name="bio" rows={3} defaultValue={sp.bio} /></Field></div>
            <div className="md:col-span-2"><Field label="Audiência"><Textarea name="audienceDescription" rows={2} defaultValue={sp.audienceDescription ?? ""} /></Field></div>
            <div className="md:col-span-2"><Button type="submit">Guardar perfil</Button></div>
          </form></Card>
        ) : null}
      </div>
    </div>
  );
}
