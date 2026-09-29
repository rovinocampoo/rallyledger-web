import { apiFetch } from "./client";
import type { PairRecord, PlayerRecord } from "../types/record";

export function getPlayerRecords() {
  return apiFetch<PlayerRecord[]>("/records/players");
}

export function getPairRecords() {
  return apiFetch<PairRecord[]>("/records/pairs");
}
