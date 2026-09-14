import { apiFetch } from "./client";
import type { MatchParticipant } from "../types/matchParticipant"


export function getMatchParticipants(matchId: number) {
  return apiFetch<MatchParticipant[]>(
    `/matches/${matchId}/participants`,
  );
}

export function addMatchParticipant(
  matchId: number,
  participantId: number,
  teamSide: string,
) {
  return apiFetch<MatchParticipant>(
    `/matches/${matchId}/participants`,
    {
      method: "POST",
      body: JSON.stringify({
        participantId,
        teamSide,
      }),
    },
  );
}

export function updateMatchParticipantTeam(
  matchId: number,
  participantId: number,
  teamSide: string,
) {
  return apiFetch<MatchParticipant>(
    `/matches/${matchId}/participants/${participantId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        teamSide,
      }),
    },
  );
}

export function removeMatchParticipant(
  matchId: number,
  participantId: number,
) {
  return apiFetch<void>(
    `/matches/${matchId}/participants/${participantId}`,
    {
      method: "DELETE",
    },
  );
}