"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, brandProfiles, streamerProfiles } from "@/db/schema";
import { createSession, destroySession, getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

export async function registerAction(form: FormData) {
  const data = registerSchema.safeParse({
    name: String(form.get("name") ?? ""), email: String(form.get("email") ?? "").toLowerCase().trim(),
    password: String(form.get("password") ?? ""), role: String(form.get("role") ?? ""),
  });
  if (!data.success) return { error: data.error.issues[0]?.message ?? "Dados inválidos." };
  const rl = rateLimit(`reg:dummy`, 30);
  if (!rl.ok) return { error: "Demasiadas tentativas. Tenta mais tarde." };
  const exists = await db.select().from(users).where(eq(users.email, data.data.email));
  if (exists.length > 0) return { error: "Já existe conta com este email." };
  const [u] = await db.insert(users).values({
    name: data.data.name, email: data.data.email,
    passwordHash: await hashPassword(data.data.password),
    role: data.data.role, status: "PENDING",
  }).returning();
  if (data.data.role === "BRAND") {
    await db.insert(brandProfiles).values({
      userId: u.id, companyName: data.data.name, city: "", district: "",
      contactName: data.data.name, contactEmail: data.data.email, category: "outros",
    });
  } else {
    await db.insert(streamerProfiles).values({ userId: u.id, displayName: data.data.name, city: "", district: "" });
  }
  await createSession(u.id);
  await audit("conta.registada", "user", u.id, u.id, { role: u.role });
  redirect("/dashboard/perfil");
}

export async function loginAction(form: FormData) {
  const data = loginSchema.safeParse({ email: String(form.get("email") ?? "").toLowerCase().trim(), password: String(form.get("password") ?? "") });
  if (!data.success) return { error: "Email ou palavra-passe inválidos." };
  const rl = rateLimit(`login:${data.data.email}`, 10);
  if (!rl.ok) return { error: "Demasiadas tentativas. Aguarda um minuto." };
  const rows = await db.select().from(users).where(eq(users.email, data.data.email));
  const ok = rows[0] ? await verifyPassword(data.data.password, rows[0].passwordHash) : false;
  if (!rows[0] || !ok) return { error: "Email ou palavra-passe inválidos." };
  await createSession(rows[0].id);
  await audit("conta.login", "user", rows[0].id, rows[0].id, {});
  redirect("/dashboard");
}

export async function logoutAction() {
  const u = await getSessionUser().catch(() => null);
  await destroySession();
  if (u) await audit("conta.logout", "user", u.id, u.id, {}).catch(() => {});
  redirect("/");
}
