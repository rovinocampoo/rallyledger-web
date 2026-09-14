import { apiFetch } from "./client";
import type { ParticipantLedger } from "../types/ledger";

export function getParticipantLedger(participantId: number) {
  return apiFetch<ParticipantLedger>(
    `/participants/${participantId}/ledger`,
  );
}