"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { brandProfiles, streamerChannels, streamerOffers, streamerProfiles, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isSafeHttpUrl } from "@/lib/utils";
import { brandProfileSchema, channelSchema, offerSchema, streamerProfileSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";

export async function saveBrandProfileAction(form: FormData) {
  const user = await getSessionUser();
  if (!user || (user.role !== "BRAND" && user.role !== "ADMIN")) return { error: "Sem permissão." };
  const parsed = brandProfileSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifica os campos." };
  if (parsed.data.website && !isSafeHttpUrl(parsed.data.website)) return { error: "Website inválido." };
  const d = parsed.data;
  await db.update(brandProfiles).set({
    companyName: d.companyName, category: d.category.toLowerCase(), city: d.city, district: d.district,
    description: d.description, website: d.website || null, contactName: d.contactName,
    contactEmail: d.contactEmail, contactPhone: d.contactPhone || null, updatedAt: new Date(),
  }).where(eq(brandProfiles.userId, user.id));
  await audit("marca.perfil_atualizado", "brand_profile", user.id, user.id, {});
  revalidatePath("/dashboard/perfil");
  return { ok: true };
}

export async function saveStreamerProfileAction(form: FormData) {
  const user = await getSessionUser();
  if (!user || (user.role !== "STREAMER" && user.role !== "ADMIN")) return { error: "Sem permissão." };
  const parsed = streamerProfileSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifica os campos." };
  const d = parsed.data;
  await db.update(streamerProfiles).set({
    displayName: d.displayName, bio: d.bio, city: d.city, district: d.district,
    averageViewers: d.averageViewers ?? null, followerCount: d.followerCount ?? null,
    audienceDescription: d.audienceDescription || null,
    niches: (d.niches ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
    updatedAt: new Date(),
  }).where(eq(streamerProfiles.userId, user.id));
  await audit("streamer.perfil_atualizado", "streamer_profile", user.id, user.id, {});
  revalidatePath("/dashboard/perfil");
  return { ok: true };
}

export async function addChannelAction(form: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "STREAMER") return { error: "Sem permissão." };
  const parsed = channelSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifica os campos." };
  if (!isSafeHttpUrl(parsed.data.channelUrl)) return { error: "URL do canal inválido." };
  const [sp] = await db.select().from(streamerProfiles).where(eq(streamerProfiles.userId, user.id));
  if (!sp) return { error: "Perfil em falta." };
  await db.insert(streamerChannels).values({ streamerProfileId: sp.id, ...parsed.data, verified: false });
  revalidatePath("/dashboard/streamer/canais");
  return { ok: true };
}

export async function addOfferAction(form: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "STREAMER") return { error: "Sem permissão." };
  const parsed = offerSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifica os campos." };
  const [sp] = await db.select().from(streamerProfiles).where(eq(streamerProfiles.userId, user.id));
  if (!sp) return { error: "Perfil em falta." };
  await db.insert(streamerOffers).values({
    streamerProfileId: sp.id, title: parsed.data.title, description: parsed.data.description,
    format: parsed.data.format, basePriceCents: parsed.data.basePriceCents,
    estimatedDurationMinutes: parsed.data.estimatedDurationMinutes ?? null,
  });
  revalidatePath("/dashboard/streamer/ofertas");
  return { ok: true };
}

export async function adminSetUserStatusAction(userId: string, status: "PENDING" | "APPROVED" | "SUSPENDED") {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "ADMIN") return { error: "Só o admin pode moderar." };
  await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, userId));
  await audit(`utilizador.${status.toLowerCase()}`, "user", userId, admin.id, { status });
  revalidatePath("/admin");
  return { ok: true };
}
