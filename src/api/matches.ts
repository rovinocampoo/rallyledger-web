import { apiFetch } from "./client";
import type { Match } from "../types/match";

export type CreateMatchInput = {
  sessionId: number;
  courtId: number;
  matchType: string;
  lightsOn: boolean;
};

export function getSessionMatches(sessionId: number) {
  return apiFetch<Match[]>(
    `/sessions/${sessionId}/matches`,
  );
}

export function createMatch(data: CreateMatchInput) {
  return apiFetch<Match>("/matches", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteMatch(id: number) {
  return apiFetch<void>(`/matches/${id}`, {
    method: "DELETE",
  });
}

export type UpdateMatchInput = {
  sessionId: number;
  courtId: number;
  matchType: string;
  result: string | null;
  lightsOn: boolean;
};

export function updateMatch(
  matchId: number,
  data: UpdateMatchInput,
) {
  return apiFetch<Match>(`/matches/${matchId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}