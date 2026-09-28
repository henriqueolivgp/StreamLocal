import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function audit(action: string, entityType: string, entityId: string, actorUserId?: string | null, metadata?: unknown) {
  try {
    await db.insert(auditLogs).values({ action, entityType, entityId, actorUserId: actorUserId ?? null, metadata: (metadata ?? {}) as Record<string, unknown> });
  } catch { /* auditoria nunca deve partir o fluxo */ }
}
