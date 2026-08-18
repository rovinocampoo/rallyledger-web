import { apiFetch } from "./client"

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

export function getCurrentAdmin() {
  return apiFetch<AdminUser>("/auth/me")
}

export function logout() {
  return apiFetch<void>("/auth/logout", {
    method: "POST",
  })
}