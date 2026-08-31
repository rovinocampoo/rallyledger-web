import { apiFetch } from "./client";
import type { Organization } from "../types/organization";

export function getCurrentOrganization() {
  return apiFetch<Organization>("/organization");
}