import { apiFetch } from "./client";
import type { Court } from "../types/court";

export function getCourts() {
  return apiFetch<Court[]>("/courts");
}