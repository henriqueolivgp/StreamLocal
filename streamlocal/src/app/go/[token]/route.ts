import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, brandProfiles, campaigns } from "@/db/schema";
import { isSafeHttpUrl } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  // Token = overlayToken da candidatura; QR aponta para /go/[token]
  const rows = await db.select({ app: applications, c: campaigns, b: brandProfiles }).from(applications)
    .innerJoin(campaigns, eq(applications.campaignId, campaigns.id))
    .innerJoin(brandProfiles, eq(campaigns.brandProfileId, brandProfiles.id))
    .where(eq(applications.overlayToken, params.token));
  const row = rows[0];
  if (!row) notFound();
  await db.insert((await import("@/db/schema")).campaignEvents).values({
    campaignId: row.c.id, applicationId: row.app.id, eventType: "QR_PAGE_VIEW", metadata: { via: "qr" },
  });
  const dest = row.c.destinationUrl;
  if (dest && isSafeHttpUrl(dest)) redirect(dest);
  redirect(`/overlay/${params.token}`);
}
