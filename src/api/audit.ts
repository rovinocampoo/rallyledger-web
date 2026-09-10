import { apiFetch } from "./client";

export type AuditLog = {
  id: number;
  organizationId: number;
  actorAdminUserId: number | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export function getAuditLogs() {
  return apiFetch<AuditLog[]>("/admin/audit-logs");
}