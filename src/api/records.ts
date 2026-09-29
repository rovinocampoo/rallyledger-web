import type { PairRecord, PlayerRecord, RecordMatchHistory } from "../types/record";
import { apiFetch } from "./client";

export type RecordDateRange = {
  from?: string;
  to?: string;
};

function buildQuery(range?: RecordDateRange) {
  const params = new URLSearchParams();

  if (range?.from) {
    params.set("from", range.from);
  }

  if (range?.to) {
    params.set("to", range.to);
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

export async function getPlayerRecords(range?: RecordDateRange) {
  return apiFetch<PlayerRecord[]>(`/records/players${buildQuery(range)}`);
}

export async function getPairRecords(range?: RecordDateRange) {
  return apiFetch<PairRecord[]>(`/records/pairs${buildQuery(range)}`);
}

export async function getPlayerMatchHistory(
  participantId: number,
  range?: RecordDateRange,
): Promise<RecordMatchHistory[]> {
  return apiFetch<RecordMatchHistory[]>(
    `/records/players/${participantId}/matches${buildQuery(range)}`,
  );
}

export async function getPairMatchHistory(
  participantOneId: number,
  participantTwoId: number,
  range?: RecordDateRange,
): Promise<RecordMatchHistory[]> {
  return apiFetch<RecordMatchHistory[]>(
    `/records/pairs/${participantOneId}/${participantTwoId}/matches${buildQuery(range)}`,
  );
}
