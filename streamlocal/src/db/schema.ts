import {
  pgTable, pgEnum, uuid, text, varchar, integer, boolean, timestamp, jsonb, uniqueIndex, index,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------
export const roleEnum = pgEnum("role", ["ADMIN", "BRAND", "STREAMER"]);
export const userStatusEnum = pgEnum("user_status", ["PENDING", "APPROVED", "SUSPENDED"]);
export const campaignStatusEnum = pgEnum("campaign_status", [
  "DRAFT", "PENDING_REVIEW", "PUBLISHED", "PAUSED", "MATCHED", "ACTIVE", "COMPLETED", "REJECTED", "ARCHIVED",
]);
export const applicationStatusEnum = pgEnum("application_status", [
  "PENDING", "SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN", "COMPLETED",
]);
export const deliverableStatusEnum = pgEnum("deliverable_status", [
  "PENDING", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REVISION_REQUESTED",
]);
export const platformEnum = pgEnum("platform", ["TWITCH", "YOUTUBE", "KICK", "TIKTOK"]);
export const offerFormatEnum = pgEnum("offer_format", [
  "LIVE_MENTION", "OBS_OVERLAY", "PROMO_CODE", "GIVEAWAY", "UNBOXING", "SOCIAL_POST", "OTHER",
]);
export const deliverableTypeEnum = pgEnum("deliverable_type", [
  "LIVE_MENTION", "OVERLAY", "QR_CODE", "PROMO_CODE", "STREAM_SEGMENT", "CLIP", "SOCIAL_POST", "REPORT", "OTHER",
]);
export const compensationEnum = pgEnum("compensation", ["FIXED", "PRODUCT", "HYBRID", "NEGOTIABLE"]);
export const objectiveEnum = pgEnum("objective", [
  "AWARENESS", "COUPON_SALES", "WEBSITE_TRAFFIC", "LOCAL_VISITS", "EVENT_ATTENDANCE", "APP_DOWNLOADS", "OTHER",
]);
export const overlayThemeEnum = pgEnum("overlay_theme", ["DARK", "LIGHT", "NEON"]);
export const eventTypeEnum = pgEnum("event_type", [
  "OVERLAY_VIEW", "OVERLAY_SESSION_STARTED", "OVERLAY_SESSION_ENDED", "LINK_CLICK", "QR_PAGE_VIEW", "MANUAL_NOTE",
]);

// ---------- users ----------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  status: userStatusEnum("status").notNull().default("PENDING"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- sessions (solução própria, documentada no README) ----------
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ sessionsUserIdx: index("sessions_user_idx").on(t.userId) }));

// ---------- brand_profiles ----------
export const brandProfiles = pgTable("brand_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 160 }).notNull(),
  legalName: varchar("legal_name", { length: 200 }),
  nif: varchar("nif", { length: 20 }),
  website: varchar("website", { length: 255 }),
  description: text("description").notNull().default(""),
  category: varchar("category", { length: 80 }).notNull().default("outros"),
  city: varchar("city", { length: 120 }).notNull().default(""),
  district: varchar("district", { length: 120 }).notNull().default(""),
  contactName: varchar("contact_name", { length: 160 }).notNull().default(""),
  contactEmail: varchar("contact_email", { length: 255 }).notNull().default(""),
  contactPhone: varchar("contact_phone", { length: 40 }),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- streamer_profiles ----------
export const streamerProfiles = pgTable("streamer_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  bio: text("bio").notNull().default(""),
  city: varchar("city", { length: 120 }).notNull().default(""),
  district: varchar("district", { length: 120 }).notNull().default(""),
  country: varchar("country", { length: 8 }).notNull().default("PT"),
  avatarUrl: text("avatar_url"),
  averageViewers: integer("average_viewers"),
  followerCount: integer("follower_count"),
  audienceDescription: text("audience_description"),
  languages: text("languages").array().notNull().default(["pt-PT"]),
  niches: text("niches").array().notNull().default([]),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- streamer_channels ----------
export const streamerChannels = pgTable("streamer_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  streamerProfileId: uuid("streamer_profile_id").notNull().references(() => streamerProfiles.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  channelName: varchar("channel_name", { length: 160 }).notNull(),
  channelUrl: text("channel_url").notNull(),
  verified: boolean("verified").notNull().default(false),
  followerCount: integer("follower_count"),
  averageViewers: integer("average_viewers"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  channelsStreamerPlatformUrl: uniqueIndex("channels_streamer_platform_url").on(t.streamerProfileId, t.platform, t.channelUrl),
  channelsStreamerIdx: index("channels_streamer_idx").on(t.streamerProfileId),
}));

// ---------- streamer_offers ----------
export const streamerOffers = pgTable("streamer_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  streamerProfileId: uuid("streamer_profile_id").notNull().references(() => streamerProfiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description").notNull().default(""),
  format: offerFormatEnum("format").notNull(),
  basePriceCents: integer("base_price_cents").notNull().default(0),
  currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
  estimatedDurationMinutes: integer("estimated_duration_minutes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ offersStreamerIdx: index("offers_streamer_idx").on(t.streamerProfileId) }));

// ---------- campaigns ----------
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandProfileId: uuid("brand_profile_id").notNull().references(() => brandProfiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  shortDescription: varchar("short_description", { length: 300 }).notNull().default(""),
  description: text("description").notNull().default(""),
  category: varchar("category", { length: 80 }).notNull().default("outros"),
  platforms: text("platforms").array().notNull().default([]),
  targetNiches: text("target_niches").array().notNull().default([]),
  targetCities: text("target_cities").array().notNull().default([]),
  targetDistricts: text("target_districts").array().notNull().default([]),
  minAverageViewers: integer("min_average_viewers"),
  maxAverageViewers: integer("max_average_viewers"),
  budgetCents: integer("budget_cents").notNull().default(0),
  currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
  compensationType: compensationEnum("compensation_type").notNull().default("FIXED"),
  campaignObjective: objectiveEnum("campaign_objective").notNull().default("AWARENESS"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  applicationDeadline: timestamp("application_deadline", { withTimezone: true }),
  requirements: text("requirements").notNull().default(""),
  briefing: text("briefing"),
  couponCode: varchar("coupon_code", { length: 80 }),
  destinationUrl: text("destination_url"),
  qrCodeEnabled: boolean("qr_code_enabled").notNull().default(false),
  overlayTheme: overlayThemeEnum("overlay_theme").notNull().default("DARK"),
  status: campaignStatusEnum("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
}, (t) => ({
  campaignsStatusIdx: index("campaigns_status_idx").on(t.status),
  campaignsBrandIdx: index("campaigns_brand_idx").on(t.brandProfileId),
}));

// ---------- campaign_deliverables ----------
export const campaignDeliverables = pgTable("campaign_deliverables", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  type: deliverableTypeEnum("type").notNull().default("OTHER"),
  required: boolean("required").notNull().default(true),
  expectedDurationMinutes: integer("expected_duration_minutes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ deliverablesCampaignIdx: index("deliverables_campaign_idx").on(t.campaignId) }));

// ---------- applications ----------
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  streamerProfileId: uuid("streamer_profile_id").notNull().references(() => streamerProfiles.id, { onDelete: "cascade" }),
  proposedPriceCents: integer("proposed_price_cents"),
  message: text("message").notNull().default(""),
  status: applicationStatusEnum("status").notNull().default("PENDING"),
  brandNote: text("brand_note"),
  streamerNote: text("streamer_note"),
  overlayToken: varchar("overlay_token", { length: 128 }).unique(),
  appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
}, (t) => ({
  applicationsCampaignStreamer: uniqueIndex("applications_campaign_streamer").on(t.campaignId, t.streamerProfileId),
  applicationsCampaignIdx: index("applications_campaign_idx").on(t.campaignId),
  applicationsStreamerIdx: index("applications_streamer_idx").on(t.streamerProfileId),
}));

// ---------- application_deliverables ----------
export const applicationDeliverables = pgTable("application_deliverables", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  campaignDeliverableId: uuid("campaign_deliverable_id").notNull().references(() => campaignDeliverables.id, { onDelete: "cascade" }),
  status: deliverableStatusEnum("status").notNull().default("PENDING"),
  evidenceUrl: text("evidence_url"),
  evidenceNote: text("evidence_note"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewerNote: text("reviewer_note"),
}, (t) => ({ appdelivApplicationIdx: index("appdeliv_application_idx").on(t.applicationId) }));

// ---------- campaign_events ----------
export const campaignEvents = pgTable("campaign_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
  eventType: eventTypeEnum("event_type").notNull(),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ eventsCampaignIdx: index("events_campaign_idx").on(t.campaignId) }));

// ---------- audit_logs ----------
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: varchar("entity_id", { length: 120 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ auditCreatedIdx: index("audit_created_idx").on(t.createdAt) }));

export type User = typeof users.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Application = typeof applications.$inferSelect;
