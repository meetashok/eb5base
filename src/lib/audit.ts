import type { AuditAction, AuditActor } from '@/lib/types';
import { createServiceClient } from '@/lib/supabase-service';

export async function writeAuditLog(params: {
  action: AuditAction;
  actor: AuditActor;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = createServiceClient();
    await supabase.from('audit_log').insert({
      action: params.action,
      actor: params.actor,
      user_id: params.userId ?? null,
      metadata: params.metadata ?? null,
    });
  } catch (err) {
    // Never fail the primary flow because audit logging failed
    console.error('audit_log write failed', err);
  }
}
