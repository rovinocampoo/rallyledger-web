import { apiFetch } from "./client"
import type { OrganizationAccess } from "../types/organization";

export type AdminUser = {
  id: number
  organizationId: number
  email: string
}

export type LoginInput = {
  email: string
  password: string
}

export function login(data: LoginInput) {
  return apiFetch<AdminUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function loginWithGoogle(credential: string) {
  return apiFetch<AdminUser>("/auth/google", {
    method: "POST",
    body: JSON.stringify({
      credential,
    }),
  });
}

export function getCurrentAdmin() {
  return apiFetch<AdminUser>("/auth/me")
}

export function logout() {
  return apiFetch<void>("/auth/logout", {
    method: "POST",
  })
}

export function getAdminOrganizations() {
  return apiFetch<OrganizationAccess[]>("/auth/organizations");
}

export function switchOrganization(organizationId: number) {
  return apiFetch<void>("/auth/organization", {
    method: "POST",
    body: JSON.stringify({
      organizationId,
    }),
  });
}

