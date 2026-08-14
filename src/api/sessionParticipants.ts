import { apiFetch } from "./client";
import type { SessionParticipant } from "../types/sessionParticipant";

export function getSessionParticipants(sessionId: number) {
  return apiFetch<SessionParticipant[]>(
    `/sessions/${sessionId}/participants`,
  );
}

export function addSessionParticipant(
  sessionId: number,
  participantId: number,
) {
  return apiFetch<SessionParticipant>(
    `/sessions/${sessionId}/participants/${participantId}`,
    {
      method: "POST",
      body: JSON.stringify({
      }),
    },
  );
}

export function removeSessionParticipant(
  sessionId: number,
  participantId: number,
) {
  return apiFetch<void>(
    `/sessions/${sessionId}/participants/${participantId}`,
    {
      method: "DELETE",
    },
  );
}