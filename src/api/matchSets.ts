import { apiFetch } from "./client";
import type { MatchSet } from "../types/matchSet";

export type CreateMatchSetInput = {
  setNumber: number;
  teamAScore: number;
  teamBScore: number;
};

export function getMatchSets(matchId: number) {
  return apiFetch<MatchSet[]>(
    `/matches/${matchId}/sets`,
  );
}

export function addMatchSet(
  matchId: number,
  data: CreateMatchSetInput,
) {
  return apiFetch<MatchSet>(
    `/matches/${matchId}/sets`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export function updateMatchSet(
  matchId: number,
  setNumber: number,
  data: CreateMatchSetInput,
) {
  return apiFetch<MatchSet>(
    `/matches/${matchId}/sets/${setNumber}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

export function deleteMatchSet(
  matchId: number,
  setNumber: number,
) {
  return apiFetch<void>(
    `/matches/${matchId}/sets/${setNumber}`,
    {
      method: "DELETE",
    },
  );
}