import type {
  Charge,
  ChargeAdjustment,
  UpdateChargeInput,
} from "../types/charge";
import { apiFetch } from "./client";

export function generateMatchCharges(matchId: number) {
  return apiFetch<void>(`/matches/${matchId}/charges`, {
    method: "POST",
  });
}

export function generateSessionMatchCharges(sessionId: number) {
  return apiFetch<Charge[]>(`/sessions/${sessionId}/match-charges`, {
    method: "POST",
  });
}

export function getMatchCharges(matchId: number) {
  return apiFetch<Charge[]>(`/matches/${matchId}/charges`);
}

export function getSessionCharges(sessionId: number) {
  return apiFetch<Charge[]>(`/sessions/${sessionId}/charges`);
}

export function updateCharge(chargeId: number, data: UpdateChargeInput) {
  return apiFetch<Charge>(`/charges/${chargeId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getChargeAdjustments(chargeId: number) {
  return apiFetch<ChargeAdjustment[]>(`/charges/${chargeId}/adjustments`);
}

export function generateTrainingCharges(sessionId: number) {
  return apiFetch<Charge[]>(`/sessions/${sessionId}/training-charges`, {
    method: "POST",
  });
}

export function generateBallRentalCharge(
  sessionId: number,
  participantId: number,
) {
  return apiFetch<Charge>(`/sessions/${sessionId}/ball-rental`, {
    method: "POST",
    body: JSON.stringify({
      participantId,
    }),
  });
}

export function generateRacketRentalCharge(
  sessionId: number,
  participantId: number,
) {
  return apiFetch<Charge>(`/sessions/${sessionId}/racket-rental`, {
    method: "POST",
    body: JSON.stringify({
      participantId,
    }),
  });
}

export function generateOutsiderCourtCharge(
  sessionId: number,
  participantId: number,
) {
  return apiFetch<Charge>(`/sessions/${sessionId}/outsider-court`, {
    method: "POST",
    body: JSON.stringify({
      participantId,
    }),
  });
}
