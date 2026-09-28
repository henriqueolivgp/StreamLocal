import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, client } from "./index";
import {
  users, brandProfiles, streamerProfiles, streamerChannels, streamerOffers,
  campaigns, campaignDeliverables, applications, applicationDeliverables, campaignEvents, auditLogs,
} from "./schema";
import { randomBytes } from "node:crypto";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 200);
}

async function upsertUser(email: string, data: { name: string; password: string; role: "ADMIN" | "BRAND" | "STREAMER" }) {
  const existing = await db.select().from(users).where(eq(users.email, email));
  const hash = await bcrypt.hash(data.password, 12);
  if (existing.length > 0) {
    await db.update(users).set({ name: data.name, passwordHash: hash, role: data.role, status: "APPROVED" }).where(eq(users.email, email));
    const [u] = await db.select().from(users).where(eq(users.email, email));
    return u;
  }
  const [u] = await db.insert(users).values({ name: data.name, email, passwordHash: hash, role: data.role, status: "APPROVED" }).returning();
  return u;
}

async function main() {
  console.log("Seed StreamLocal (idempotente)…");

  const admin = await upsertUser("admin@streamlocal.test", { name: "Admin StreamLocal", password: "Admin123!", role: "ADMIN" });
  const brandUser = await upsertUser("marca@pixelportugal.test", { name: "Pixel Porto", password: "Marca123!", role: "BRAND" });
  const streamerUser = await upsertUser("streamer@rafaelplays.test", { name: "RafaelPlays", password: "Streamer123!", role: "STREAMER" });
  // Extra pendente para o admin moderar
  await upsertUser("pendente@demo.test", { name: "Demo Pendente", password: "Demo123!", role: "STREAMER" }).then(async (u) => {
    await db.update(users).set({ status: "PENDING" }).where(eq(users.id, u.id));
  });

  // ---- brand profile ----
  let brandRows = await db.select().from(brandProfiles).where(eq(brandProfiles.userId, brandUser.id));
  let brand = brandRows[0];
  if (!brand) {
    [brand] = await db.insert(brandProfiles).values({
      userId: brandUser.id, companyName: "Pixel Porto", legalName: "Pixel Porto Lda",
      website: "https://pixelporto.example.pt", description: "Loja portuense de gaming, board games e cultura pop.",
      category: "tecnologia/gaming", city: "Porto", district: "Porto",
      contactName: "Marta Sousa", contactEmail: "marca@pixelportugal.test", contactPhone: "+351 220 000 000",
    }).returning();
  }

  // ---- streamer profile ----
  let spRows = await db.select().from(streamerProfiles).where(eq(streamerProfiles.userId, streamerUser.id));
  let sp = spRows[0];
  if (!sp) {
    [sp] = await db.insert(streamerProfiles).values({
      userId: streamerUser.id, displayName: "RafaelPlays",
      bio: "Streamer do Porto focado em Pokémon, indies e retro gaming. Comunidade calma e participativa.",
      city: "Porto", district: "Porto", country: "PT",
      averageViewers: 320, followerCount: 8400,
      audienceDescription: "18–34, Portugal, fãs de Nintendo e jogos indie.",
      languages: ["pt-PT"], niches: ["gaming", "pokémon", "jogos indie"], isPublic: true,
    }).returning();
  }

  const existingChannels = await db.select().from(streamerChannels).where(eq(streamerChannels.streamerProfileId, sp.id));
  if (existingChannels.length === 0) {
    await db.insert(streamerChannels).values([
      { streamerProfileId: sp.id, platform: "TWITCH", channelName: "rafaelplays", channelUrl: "https://twitch.tv/rafaelplays", verified: false, followerCount: 8400, averageViewers: 320 },
      { streamerProfileId: sp.id, platform: "YOUTUBE", channelName: "RafaelPlays", channelUrl: "https://youtube.com/@rafaelplays", verified: false, followerCount: 2100, averageViewers: 150 },
    ]);
  }
  const existingOffers = await db.select().from(streamerOffers).where(eq(streamerOffers.streamerProfileId, sp.id));
  if (existingOffers.length === 0) {
    await db.insert(streamerOffers).values([
      { streamerProfileId: sp.id, title: "Menção em live (60s)", description: "Menção natural do produto durante a live.", format: "LIVE_MENTION", basePriceCents: 2500, estimatedDurationMinutes: 5 },
      { streamerProfileId: sp.id, title: "Overlay OBS com cupão", description: "Browser source com branding e cupão durante 30 min.", format: "OBS_OVERLAY", basePriceCents: 4000, estimatedDurationMinutes: 30 },
      { streamerProfileId: sp.id, title: "Código promocional", description: "Divulgação de cupão + link na descrição.", format: "PROMO_CODE", basePriceCents: 1500 },
      { streamerProfileId: sp.id, title: "Unboxing em live", description: "Abertura de produto em direto.", format: "UNBOXING", basePriceCents: 6000, estimatedDurationMinutes: 20 },
    ]);
  }

  // ---- campanhas demo ----
  const demoCampaigns = [
    { title: "Noite Indie no Porto", short: "Divulga o festival de jogos indie da Pixel Porto.", cat: "gaming", obj: "EVENT_ATTENDANCE" as const, status: "PUBLISHED" as const, budget: 45000, coupon: "PORTOINDIE10", qr: true, theme: "NEON" as const },
    { title: "Acessórios Retro Week", short: "Comandos e acessórios retro com desconto local.", cat: "tecnologia", obj: "COUPON_SALES" as const, status: "PUBLISHED" as const, budget: 30000, coupon: "RETRO15", qr: true, theme: "DARK" as const },
    { title: "Café Gamer — Visita a loja", short: "Tráfego para a loja física na Baixa do Porto.", cat: "local", obj: "LOCAL_VISITS" as const, status: "ACTIVE" as const, budget: 60000, coupon: "CAFEGAMER", qr: true, theme: "DARK" as const },
    { title: "Lançamento TCG Outono", short: "Rascunho interno de expansão TCG.", cat: "gaming", obj: "AWARENESS" as const, status: "DRAFT" as const, budget: 20000, coupon: null, qr: false, theme: "DARK" as const },
    { title: "App Pixel Rewards", short: "Em revisão: downloads da app de fidelização.", cat: "tecnologia", obj: "APP_DOWNLOADS" as const, status: "PENDING_REVIEW" as const, budget: 25000, coupon: null, qr: false, theme: "LIGHT" as const },
  ];
  const campaignIds: Record<string, string> = {};
  for (const c of demoCampaigns) {
    const slug = slugify(c.title) + "-demo";
    const found = await db.select().from(campaigns).where(eq(campaigns.slug, slug));
    if (found.length > 0) { campaignIds[c.title] = found[0].id; continue; }
    const [row] = await db.insert(campaigns).values({
      brandProfileId: brand.id, title: c.title, slug,
      shortDescription: c.short, description: `${c.short} Campanha de demonstração da Pixel Porto para streamers portugueses.`,
      category: c.cat, platforms: ["TWITCH", "YOUTUBE"], targetNiches: ["gaming", "jogos indie"],
      targetCities: ["Porto"], targetDistricts: ["Porto"], minAverageViewers: 50,
      budgetCents: c.budget, compensationType: "FIXED", campaignObjective: c.obj,
      startDate: new Date(), endDate: new Date(Date.now() + 30 * 864e5),
      applicationDeadline: new Date(Date.now() + 14 * 864e5),
      requirements: "Stream em português, menção de parceria paga, OBS overlay visível.",
      briefing: "Fala do evento/loja de forma natural. Mostra o cupão 2x por hora. Não prometas stock que não exista.",
      couponCode: c.coupon, destinationUrl: "https://pixelporto.example.pt/promo",
      qrCodeEnabled: c.qr, overlayTheme: c.theme, status: c.status,
      publishedAt: c.status !== "DRAFT" && c.status !== "PENDING_REVIEW" ? new Date() : null,
    }).returning();
    campaignIds[c.title] = row.id;
    await db.insert(campaignDeliverables).values([
      { campaignId: row.id, title: "Overlay OBS 30 min", description: "Manter browser source visível.", type: "OVERLAY", required: true, sortOrder: 0 },
      { campaignId: row.id, title: `Menção com cupão ${c.coupon ?? ""}`.trim(), description: "Referir cupão em direto.", type: "PROMO_CODE", required: true, sortOrder: 1 },
      { campaignId: row.id, title: "Clip de evidência", description: "Submeter clip/URL como prova.", type: "CLIP", required: false, sortOrder: 2 },
    ]);
  }

  // ---- candidaturas demo ----
  const activeId = campaignIds["Café Gamer — Visita a loja"];
  const indieId = campaignIds["Noite Indie no Porto"];
  const retroId = campaignIds["Acessórios Retro Week"];
  async function ensureApplication(campaignId: string, status: "PENDING" | "ACCEPTED" | "SHORTLISTED", msg: string) {
    const found = await db.select().from(applications)
      .where(eq(applications.campaignId, campaignId));
    const mine = found.filter((a) => a.streamerProfileId === sp.id);
    if (mine.length > 0) return mine[0];
    const [app] = await db.insert(applications).values({
      campaignId, streamerProfileId: sp.id, message: msg, status,
      proposedPriceCents: 4500,
      overlayToken: status === "ACCEPTED" ? randomBytes(32).toString("hex") : null,
      decidedAt: status === "PENDING" ? null : new Date(),
    }).returning();
    // criar application_deliverables quando aceite
    if (status === "ACCEPTED") {
      const dels = await db.select().from(campaignDeliverables).where(eq(campaignDeliverables.campaignId, campaignId));
      for (const d of dels) {
        await db.insert(applicationDeliverables).values({
          applicationId: app.id, campaignDeliverableId: d.id,
          status: d.title.includes("Overlay") ? "SUBMITTED" : "IN_PROGRESS",
          evidenceUrl: d.title.includes("Overlay") ? "https://twitch.tv/videos/demo-clip" : null,
          evidenceNote: d.title.includes("Overlay") ? "Overlay visível das 21h às 21h30." : null,
          submittedAt: d.title.includes("Overlay") ? new Date() : null,
        });
      }
      for (let i = 0; i < 12; i++) {
        await db.insert(campaignEvents).values({
          campaignId, applicationId: app.id,
          eventType: i % 4 === 0 ? "QR_PAGE_VIEW" : "OVERLAY_VIEW",
          metadata: { demo: true, minute: i * 5 },
        });
      }
    }
    return app;
  }
  await ensureApplication(activeId, "ACCEPTED", "Adorava promover a loja — o meu público é todo do Porto!");
  await ensureApplication(indieId, "PENDING", "Alinho a Noite Indie com a minha rubrica semanal de indies.");
  await ensureApplication(retroId, "SHORTLISTED", "Faço retro às quintas, encaixa perfeito.");

  await db.insert(auditLogs).values({
    actorUserId: admin.id, action: "seed.executed", entityType: "system", entityId: "seed",
    metadata: { at: new Date().toISOString() },
  });

  console.log("Seed concluído. Contas: admin@streamlocal.test / marca@pixelportugal.test / streamer@rafaelplays.test");
  await client.end();
}

main().catch(async (e) => { console.error(e); await client.end().catch(() => {}); process.exit(1); });
