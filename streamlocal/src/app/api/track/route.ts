import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, campaignEvents } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = String(body.token ?? "");
    const type = String(body.type ?? "OVERLAY_VIEW");
    if (!token || token.length < 16) return Response.json({ ok: false }, { status: 400 });
    const rl = rateLimit(`track:${token}`, 60);
    if (!rl.ok) return Response.json({ ok: false }, { status: 429 });
    const rows = await db.select().from(applications).where(eq(applications.overlayToken, token));
    const app = rows[0];
    if (!app) return Response.json({ ok: false }, { status: 404 });
    const allowed = ["OVERLAY_VIEW", "OVERLAY_SESSION_STARTED", "OVERLAY_SESSION_ENDED", "LINK_CLICK"] as const;
    const eventType = (allowed as readonly string[]).includes(type) ? (type as typeof allowed[number]) : "OVERLAY_VIEW";
    await db.insert(campaignEvents).values({ campaignId: app.campaignId, applicationId: app.id, eventType, metadata: {} });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
