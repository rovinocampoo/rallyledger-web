import { apiFetch } from "./client";
import type { Court, CourtInput } from "../types/court";

export function getCourts() {
  return apiFetch<Court[]>("/courts");
}

export function createCourt(data: CourtInput) {
  return apiFetch<Court>("/courts", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function updateCourt(
  id: number,
  data: CourtInput,
) {
  return apiFetch<Court>(`/courts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCourt(id: number) {
  return apiFetch<void>(`/courts/${id}`, {
    method: "DELETE",
  });
}