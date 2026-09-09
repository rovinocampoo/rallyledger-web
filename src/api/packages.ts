import { apiFetch } from "./client";
import type {
  CreatePackageInput,
  PackageDetails,
} from "../types/package";

export function createPackage(
  input: CreatePackageInput,
) {
  return apiFetch<PackageDetails>("/packages", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getPackage(packageId: number) {
  return apiFetch<PackageDetails>(
    `/packages/${packageId}`,
  );
}

export function getSessionPackages(sessionId: number) {
  return apiFetch<PackageDetails[]>(
    `/sessions/${sessionId}/packages`,
  );
}