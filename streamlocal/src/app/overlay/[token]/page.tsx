import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, brandProfiles, campaigns } from "@/db/schema";
import OverlayView from "./overlay-view";

export default async function OverlayPage({ params }: { params: { token: string } }) {
  const rows = await db.select({ app: applications, c: campaigns, b: brandProfiles }).from(applications)
    .innerJoin(campaigns, eq(applications.campaignId, campaigns.id))
    .innerJoin(brandProfiles, eq(campaigns.brandProfileId, brandProfiles.id))
    .where(eq(applications.overlayToken, params.token));
  const row = rows[0];
  if (!row || row.app.status !== "ACCEPTED") notFound();
  // regista visualização (best-effort, sem bloquear)
  await db.insert((await import("@/db/schema")).campaignEvents).values({
    campaignId: row.c.id, applicationId: row.app.id, eventType: "OVERLAY_VIEW", metadata: { ua: "overlay" },
  });
  return <OverlayView brand={row.b.companyName} campaign={row.c.title} coupon={row.c.couponCode} qr={row.c.qrCodeEnabled} theme={row.c.overlayTheme} token={params.token} destination={row.c.destinationUrl} />;
}
