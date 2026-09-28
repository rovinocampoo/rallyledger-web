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

export function uploadOrganizationGcashQR(file: File) {
  const formData = new FormData();
  formData.append("qr", file);

  return apiFetch<{ success: boolean }>("/organization/gcash-qr", {
    method: "PUT",
    body: formData,
  });
}

export function deleteOrganizationGcashQR() {
  return apiFetch<{ success: boolean }>("/organization/gcash-qr", {
    method: "DELETE",
  });
}

export function getOrganizationGcashQR() {
  return apiFetchBlob(`/organization/gcash-qr?t=${Date.now()}`);
}

export function updateOrganizationGcashNumber(number: string) {
  return apiFetch<{ success: boolean }>("/organization/gcash-number", {
    method: "PUT",
    body: JSON.stringify({ number }),
  });
}
