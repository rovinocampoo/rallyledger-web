import { apiFetch, apiFetchBlob } from "./client";
import type { Organization } from "../types/organization";

export type UpdateOrganizationInput = {
  name: string;
  slug: string;
};

export function getCurrentOrganization() {
  return apiFetch<Organization>("/organization");
}

export function updateOrganization(data: UpdateOrganizationInput) {
  return apiFetch<Organization>("/organization", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function uploadOrganizationLogo(file: File) {
  const formData = new FormData();
  formData.append("logo", file);

  return apiFetch<{ success: boolean }>("/organization/logo", {
    method: "PUT",
    body: formData,
  });
}

export function deleteOrganizationLogo() {
  return apiFetch<{ success: boolean }>("/organization/logo", {
    method: "DELETE",
  });
}

export function getOrganizationLogo() {
  return apiFetchBlob(`/organization/logo?t=${Date.now()}`);
}
