import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nome demasiado curto.").max(120),
  email: z.string().email("Email inválido.").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres.").max(100),
  role: z.enum(["BRAND", "STREAMER"], { errorMap: () => ({ message: "Escolhe Marca ou Streamer." }) }),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(1, "Indica a palavra-passe."),
});

export const brandProfileSchema = z.object({
  companyName: z.string().min(2).max(160),
  category: z.string().min(2).max(80),
  city: z.string().min(2).max(120),
  district: z.string().min(2).max(120),
  description: z.string().max(2000).default(""),
  website: z.string().url("URL inválido.").optional().or(z.literal("")),
  contactName: z.string().min(2).max(160),
  contactEmail: z.string().email("Email inválido."),
  contactPhone: z.string().max(40).optional().or(z.literal("")),
});

export const streamerProfileSchema = z.object({
  displayName: z.string().min(2).max(120),
  bio: z.string().max(2000).default(""),
  city: z.string().min(1).max(120),
  district: z.string().min(1).max(120),
  averageViewers: z.coerce.number().int().min(0).max(10_000_000).nullable().optional(),
  followerCount: z.coerce.number().int().min(0).max(100_000_000).nullable().optional(),
  audienceDescription: z.string().max(2000).optional().or(z.literal("")),
  niches: z.string().max(500).optional().or(z.literal("")),
});

export const channelSchema = z.object({
  platform: z.enum(["TWITCH", "YOUTUBE", "KICK", "TIKTOK"]),
  channelName: z.string().min(2).max(160),
  channelUrl: z.string().url("URL inválido."),
});

export const offerSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(2000).default(""),
  format: z.enum(["LIVE_MENTION", "OBS_OVERLAY", "PROMO_CODE", "GIVEAWAY", "UNBOXING", "SOCIAL_POST", "OTHER"]),
  basePriceCents: z.coerce.number().int().min(0).max(10_000_000),
  estimatedDurationMinutes: z.coerce.number().int().min(1).max(600).nullable().optional(),
});

export const campaignSchema = z.object({
  title: z.string().min(4, "Título demasiado curto.").max(180),
  shortDescription: z.string().min(10, "Resumo demasiado curto.").max(300),
  description: z.string().min(10).max(8000),
  category: z.string().min(2).max(80),
  platforms: z.array(z.enum(["TWITCH", "YOUTUBE", "KICK", "TIKTOK"])).min(1, "Escolhe pelo menos uma plataforma."),
  targetNiches: z.string().max(500).optional().or(z.literal("")),
  targetCities: z.string().max(500).optional().or(z.literal("")),
  targetDistricts: z.string().max(500).optional().or(z.literal("")),
  minAverageViewers: z.coerce.number().int().min(0).nullable().optional(),
  budgetCents: z.coerce.number().int().min(0, "Orçamento inválido.").max(100_000_000),
  compensationType: z.enum(["FIXED", "PRODUCT", "HYBRID", "NEGOTIABLE"]),
  campaignObjective: z.enum(["AWARENESS", "COUPON_SALES", "WEBSITE_TRAFFIC", "LOCAL_VISITS", "EVENT_ATTENDANCE", "APP_DOWNLOADS", "OTHER"]),
  requirements: z.string().min(5).max(5000),
  briefing: z.string().max(8000).optional().or(z.literal("")),
  couponCode: z.string().max(80).optional().or(z.literal("")),
  destinationUrl: z.string().url("URL inválido.").optional().or(z.literal("")),
  qrCodeEnabled: z.coerce.boolean().default(false),
  overlayTheme: z.enum(["DARK", "LIGHT", "NEON"]).default("DARK"),
  deliverables: z.array(z.object({
    title: z.string().min(3).max(180),
    type: z.enum(["LIVE_MENTION", "OVERLAY", "QR_CODE", "PROMO_CODE", "STREAM_SEGMENT", "CLIP", "SOCIAL_POST", "REPORT", "OTHER"]),
    required: z.coerce.boolean().default(true),
  })).min(1, "Adiciona pelo menos um entregável.").max(12),
});

export const applicationSchema = z.object({
  message: z.string().min(10, "Conta-nos por que és a pessoa certa (mín. 10 caracteres).").max(2000),
  proposedPriceCents: z.coerce.number().int().min(0).max(10_000_000).nullable().optional(),
});

export const evidenceSchema = z.object({
  evidenceUrl: z.string().url("URL inválido.").optional().or(z.literal("")),
  evidenceNote: z.string().max(2000).optional().or(z.literal("")),
});
