import { apiFetch } from "./client";
import type {
  OutstandingParticipant,
  ReportSummary,
} from "../types/report";

export function getReportSummary() {
  return apiFetch<ReportSummary>("/reports/summary");
}

export function getTopOutstanding() {
  return apiFetch<OutstandingParticipant[]>(
    "/reports/outstanding",
  );
}