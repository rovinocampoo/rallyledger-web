import { apiFetch } from "./client"
import type { Participant } from "../types/participant"

export function getParticipants() {
  return apiFetch<Participant[]>("/participants")
}

export function createParticipant(data: Omit<Participant, "id" | "createdAt" | "updatedAt">) {
  return apiFetch<Participant>("/participants", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function updateParticipant(
  id: number,
  data: Omit<Participant, "id" | "createdAt" | "updatedAt">,
) {
  return apiFetch<Participant>(`/participants/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteParticipant(id: number) {
  return apiFetch<void>(`/participants/${id}`, {
    method: "DELETE",
  });
}