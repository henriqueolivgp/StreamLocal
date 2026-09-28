"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { applications, applicationDeliverables, brandProfiles, campaignDeliverables, campaignEvents, campaigns, streamerProfiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isSafeHttpUrl, slugify } from "@/lib/utils";
import { applicationSchema, campaignSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

async function myBrand(userId: string) {
  const rows = await db.select().from(brandProfiles).where(eq(brandProfiles.userId, userId));
  return rows[0] ?? null;
}
const split = (s?: string | null) => (s ?? "").split(",").map((x) => x.trim().toLowerCase().replace(/\s+/g, " ")).filter(Boolean);

export async function createCampaignAction(form: FormData) {
  const user = await getSessionUser();
  if (!user || (user.role !== "BRAND" && user.role !== "ADMIN")) return { error: "Sem permissão." };
  if (user.status !== "APPROVED" && user.role !== "ADMIN") return { error: "A tua marca ainda está por aprovar." };
  const brand = user.role === "ADMIN"
    ? (await db.select().from(brandProfiles).limit(1))[0] ?? null
    : await myBrand(user.id);
  // Admin sem marca: usa a primeira marca como contentor (fluxo demo); em prod o admin atua sobre marcas existentes.
  const parsed = campaignSchema.safeParse({
    title: form.get("title"), shortDescription: form.get("shortDescription"), description: form.get("description"),
    category: form.get("category"), platforms: form.getAll("platforms"),
    targetNiches: form.get("targetNiches"), targetCities: form.get("targetCities"), targetDistricts: form.get("targetDistricts"),
    minAverageViewers: form.get("minAverageViewers") ? Number(form.get("minAverageViewers")) : null,
    budgetCents: form.get("budgetEur") ? Math.round(Number(form.get("budgetEur")) * 100) : 0,
    compensationType: form.get("compensationType"), campaignObjective: form.get("campaignObjective"),
    requirements: form.get("requirements"), briefing: form.get("briefing"),
    couponCode: form.get("couponCode"), destinationUrl: form.get("destinationUrl"),
    qrCodeEnabled: form.get("qrCodeEnabled") === "on", overlayTheme: form.get("overlayTheme"),
    deliverables: JSON.parse(String(form.get("deliverablesJson") ?? "[]")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifica os campos." };
  if (!brand) return { error: "Sem perfil de marca associado." };
  const d = parsed.data;
  if (d.destinationUrl && !isSafeHttpUrl(d.destinationUrl)) return { error: "URL de destino inválido (usa http/https)." };
  const [c] = await db.insert(campaigns).values({
    brandProfileId: brand.id, title: d.title, slug: slugify(d.title),
    shortDescription: d.shortDescription, description: d.description, category: d.category.toLowerCase(),
    platforms: d.platforms, targetNiches: split(d.targetNiches), targetCities: split(d.targetCities),
    targetDistricts: split(d.targetDistricts), minAverageViewers: d.minAverageViewers ?? null,
    budgetCents: d.budgetCents, compensationType: d.compensationType, campaignObjective: d.campaignObjective,
    requirements: d.requirements, briefing: d.briefing || null,
    couponCode: d.couponCode || null, destinationUrl: d.destinationUrl || null,
    qrCodeEnabled: d.qrCodeEnabled, overlayTheme: d.overlayTheme, status: "DRAFT",
  }).returning();
  for (let i = 0; i < d.deliverables.length; i++) {
    await db.insert(campaignDeliverables).values({
      campaignId: c.id, title: d.deliverables[i].title, type: d.deliverables[i].type,
      required: d.deliverables[i].required, sortOrder: i,
    });
  }
  await audit("campanha.criada", "campaign", c.id, user.id, { title: c.title });
  redirect(`/dashboard/marca/campanhas/${c.id}`);
}

export async function submitCampaignAction(campaignId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "É necessário iniciar sessão." };
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
  if (!c) return { error: "Campanha não encontrada." };
  if (user.role !== "ADMIN") {
    const b = await myBrand(user.id);
    if (!b || b.id !== c.brandProfileId) return { error: "Sem permissão." };
  }
  await db.update(campaigns).set({ status: "PENDING_REVIEW", updatedAt: new Date() }).where(eq(campaigns.id, campaignId));
  await audit("campanha.submetida", "campaign", campaignId, user.id, {});
  revalidatePath("/dashboard/marca/campanhas");
  redirect(`/dashboard/marca/campanhas/${campaignId}`);
}

export async function setCampaignStatusAction(campaignId: string, status: "PUBLISHED" | "PAUSED" | "ARCHIVED" | "MATCHED" | "ACTIVE" | "COMPLETED" | "REJECTED" | "DRAFT") {
  const user = await getSessionUser();
  if (!user) return { error: "É necessário iniciar sessão." };
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
  if (!c) return { error: "Campanha não encontrada." };
  const isOwner = user.role === "BRAND" && (await myBrand(user.id))?.id === c.brandProfileId;
  const allowed =
    user.role === "ADMIN" ? true :
    isOwner && ["PAUSED", "ARCHIVED", "DRAFT", "ACTIVE", "COMPLETED", "MATCHED"].includes(status);
  if (!allowed) return { error: "Sem permissão para este estado." };
  await db.update(campaigns).set({
    status, updatedAt: new Date(),
    publishedAt: status === "PUBLISHED" ? new Date() : c.publishedAt,
  }).where(eq(campaigns.id, campaignId));
  await audit(`campanha.${status.toLowerCase()}`, "campaign", campaignId, user.id, { status });
  revalidatePath("/dashboard/marca/campanhas");
  revalidatePath("/admin/campanhas");
}

export async function decideApplicationAction(applicationId: string, decision: "SHORTLISTED" | "ACCEPTED" | "REJECTED") {
  const user = await getSessionUser();
  if (!user || (user.role !== "BRAND" && user.role !== "ADMIN")) return { error: "Sem permissão." };
  const [app] = await db.select().from(applications).where(eq(applications.id, applicationId));
  if (!app) return { error: "Candidatura não encontrada." };
  const [camp] = await db.select().from(campaigns).where(eq(campaigns.id, app.campaignId));
  if (user.role === "BRAND") {
    const b = await myBrand(user.id);
    if (!b || b.id !== camp.brandProfileId) return { error: "Esta candidatura não é da tua marca." };
  }
  const patch: Partial<typeof applications.$inferInsert> = { status: decision, decidedAt: new Date(), updatedAt: new Date() };
  if (decision === "ACCEPTED" && !app.overlayToken) patch.overlayToken = randomBytes(32).toString("hex");
  await db.update(applications).set(patch).where(eq(applications.id, applicationId));
  if (decision === "ACCEPTED") {
    const existing = await db.select().from(applicationDeliverables).where(eq(applicationDeliverables.applicationId, app.id));
    if (existing.length === 0) {
      const dels = await db.select().from(campaignDeliverables).where(eq(campaignDeliverables.campaignId, app.campaignId));
      for (const d of dels) {
        await db.insert(applicationDeliverables).values({ applicationId: app.id, campaignDeliverableId: d.id, status: "PENDING" });
      }
    }
    if (camp.status === "PUBLISHED") {
      await db.update(campaigns).set({ status: "MATCHED", updatedAt: new Date() }).where(eq(campaigns.id, camp.id));
    }
  }
  await audit(`candidatura.${decision.toLowerCase()}`, "application", applicationId, user.id, {});
  revalidatePath(`/dashboard/marca/campanhas/${app.campaignId}`);
}

export async function applyToCampaignAction(campaignId: string, form: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "STREAMER") return { error: "Só streamers aprovados se podem candidatar." };
  if (user.status !== "APPROVED") return { error: "O teu perfil ainda está por aprovar." };
  const rl = rateLimit(`apply:${user.id}`, 10);
  if (!rl.ok) return { error: "Demasiadas candidaturas. Tenta mais tarde." };
  const parsed = applicationSchema.safeParse({
    message: String(form.get("message") ?? ""),
    proposedPriceCents: form.get("priceEur") ? Math.round(Number(form.get("priceEur")) * 100) : null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Mensagem inválida." };
  const srows = await db.select().from(streamerProfiles).where(eq(streamerProfiles.userId, user.id));
  const sprofile = srows[0];
  if (!sprofile) return { error: "Perfil de streamer em falta." };
  const [camp] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
  if (!camp || camp.status !== "PUBLISHED") return { error: "Campanha indisponível." };
  const dup = await db.select().from(applications).where(eq(applications.campaignId, campaignId));
  if (dup.some((a) => a.streamerProfileId === sprofile.id)) return { error: "Já te candidataste a esta campanha." };
  const [app] = await db.insert(applications).values({
    campaignId, streamerProfileId: sprofile.id,
    message: parsed.data.message, proposedPriceCents: parsed.data.proposedPriceCents ?? null, status: "PENDING",
  }).returning();
  await audit("candidatura.criada", "application", app.id, user.id, { campaignId });
  revalidatePath(`/campanhas/${camp.slug}`);
  redirect(`/dashboard/streamer/candidaturas/${app.id}`);
}

export async function submitEvidenceAction(appDeliverableId: string, form: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "STREAMER") return { error: "Sem permissão." };
  const { evidenceSchema } = await import("@/lib/validations");
  const parsed = evidenceSchema.safeParse({ evidenceUrl: String(form.get("evidenceUrl") ?? ""), evidenceNote: String(form.get("evidenceNote") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Evidência inválida." };
  if (parsed.data.evidenceUrl && !isSafeHttpUrl(parsed.data.evidenceUrl)) return { error: "URL de evidência inválido." };
  if (!parsed.data.evidenceUrl && !parsed.data.evidenceNote) return { error: "Adiciona um URL ou uma nota de evidência." };
  await db.update(applicationDeliverables).set({
    evidenceUrl: parsed.data.evidenceUrl || null, evidenceNote: parsed.data.evidenceNote || null,
    status: "SUBMITTED", submittedAt: new Date(),
  }).where(eq(applicationDeliverables.id, appDeliverableId));
  await audit("entregavel.submetido", "application_deliverable", appDeliverableId, user.id, {});
  revalidatePath("/dashboard/streamer");
}

export async function reviewDeliverableAction(appDeliverableId: string, decision: "APPROVED" | "REVISION_REQUESTED", note: string) {
  const user = await getSessionUser();
  if (!user || (user.role !== "BRAND" && user.role !== "ADMIN")) return { error: "Sem permissão." };
  await db.update(applicationDeliverables).set({
    status: decision, reviewerNote: note || null, reviewedAt: new Date(),
  }).where(eq(applicationDeliverables.id, appDeliverableId));
  await audit(`entregavel.${decision.toLowerCase()}`, "application_deliverable", appDeliverableId, user.id, {});
  revalidatePath("/dashboard/marca");
}

export async function trackEventAction(campaignId: string, applicationId: string | null, eventType: "OVERLAY_VIEW" | "LINK_CLICK" | "QR_PAGE_VIEW" | "MANUAL_NOTE", metadata?: unknown) {
  await db.insert(campaignEvents).values({ campaignId, applicationId, eventType, metadata: (metadata ?? {}) as Record<string, unknown> });
}
