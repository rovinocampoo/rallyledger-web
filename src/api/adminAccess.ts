import { apiFetch } from "./client";

export type AdminRole = "OWNER" | "ADMIN" | "COORDINATOR";
export type AdminAccess = {
  adminUserId: number;
  organizationId: number;
  email: string;
  role: AdminRole;
  createdAt: string;
};

export type CreateAdminAccessInput = {
  email: string;
  password: string;
  role: AdminRole;
};

export function getAdminAccess() {
  return apiFetch<AdminAccess[]>("/admin/access");
}

export function createAdminAccess(data: CreateAdminAccessInput) {
  return apiFetch<AdminAccess>("/admin/access", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdminAccessRole(adminUserId: number, role: AdminRole) {
  return apiFetch<AdminAccess>(`/admin/access/${adminUserId}`, {
    method: "PATCH",
    body: JSON.stringify({
      role,
    }),
  });
}

export function deleteAdminAccess(adminUserId: number) {
  return apiFetch<void>(`/admin/access/${adminUserId}`, {
    method: "DELETE",
  });
}
