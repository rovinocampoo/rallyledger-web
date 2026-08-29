import type { Charge } from "../types/charge";
import { apiFetch } from "./client";

export function generateMatchCharges(matchId: number) {
  return apiFetch<void>(`/matches/${matchId}/charges`, {
    method: "POST",
  });
}

export function getMatchCharges(matchId: number) {
  return apiFetch<Charge[]>(`/matches/${matchId}/charges`);
}

export function getSessionCharges(sessionId: number) {
  return apiFetch<Charge[]>(`/sessions/${sessionId}/charges`);
}

export function generateTrainingCharges(sessionId: number) {
  return apiFetch<Charge[]>(
    `/sessions/${sessionId}/training-charges`,
    {
      method: "POST",
    },
  );
}

export function generateBallRentalCharge(
  sessionId: number,
  participantId: number,
) {
  return apiFetch<Charge>(
    `/sessions/${sessionId}/ball-rental`,
    {
      method: "POST",
      body: JSON.stringify({
        participantId,
      }),
    },
  );
}

export function generateRacketRentalCharge(
  sessionId: number,
  participantId: number,
) {
  return apiFetch<Charge>(
    `/sessions/${sessionId}/racket-rental`,
    {
      method: "POST",
      body: JSON.stringify({
        participantId,
      }),
    },
  );
}