import { apiFetch } from "./client";
import type {
  ParticipantCategory,
  ParticipantCategoryInput,
} from "../types/participantCategory";

const PARTICIPANT_CATEGORIES_PATH = "/participant-categories";

export function getParticipantCategories() {
  return apiFetch<ParticipantCategory[]>(PARTICIPANT_CATEGORIES_PATH);
}

export function createParticipantCategory(data: ParticipantCategoryInput) {
  return apiFetch<ParticipantCategory>(PARTICIPANT_CATEGORIES_PATH, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateParticipantCategory(
  id: number,
  data: ParticipantCategoryInput,
) {
  return apiFetch<ParticipantCategory>(
    `${PARTICIPANT_CATEGORIES_PATH}/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

export function deleteParticipantCategory(id: number) {
  return apiFetch<void>(`${PARTICIPANT_CATEGORIES_PATH}/${id}`, {
    method: "DELETE",
  });
}
