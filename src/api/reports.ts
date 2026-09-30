import { apiFetch } from "./client";
import type {
  OutstandingParticipant,
  ReportSummary,
  PaymentReport,
  FinancialReport,
} from "../types/report";

export function getReportSummary(dateRange?: ReportDateRange) {
  const params = new URLSearchParams();

  if (dateRange?.from) {
    params.set("from", dateRange.from);
  }

  if (dateRange?.to) {
    params.set("to", dateRange.to);
  }

  const query = params.toString();

  return apiFetch<ReportSummary>(`/reports/summary${query ? `?${query}` : ""}`);
}

export function getOutstanding(limit?: number) {
  const params = new URLSearchParams();

  if (limit !== undefined) {
    params.set("limit", String(limit));
  }

  const query = params.toString();

  return apiFetch<OutstandingParticipant[]>(
    `/reports/outstanding${query ? `?${query}` : ""}`,
  );
}

export function getPaymentReport(dateRange?: ReportDateRange) {
  const params = new URLSearchParams();

  if (dateRange?.from) {
    params.set("from", dateRange.from);
  }

  if (dateRange?.to) {
    params.set("to", dateRange.to);
  }

  const query = params.toString();

  return apiFetch<PaymentReport>(
    `/reports/payments${query ? `?${query}` : ""}`,
  );
}

export function getFinancialReport(dateRange?: ReportDateRange) {
  const params = new URLSearchParams();

  if (dateRange?.from) {
    params.set("from", dateRange.from);
  }

  if (dateRange?.to) {
    params.set("to", dateRange.to);
  }

  const query = params.toString();

  return apiFetch<FinancialReport>(
    `/reports/financial${query ? `?${query}` : ""}`,
  );
}

export type ReportDateRange = {
  from?: string;
  to?: string;
};
