import { apiFetch } from "./client";
import type {
  OutstandingParticipant,
  ReportSummary,
  PaymentReport,
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

  return apiFetch<ReportSummary>(
    `/reports/summary${query ? `?${query}` : ""}`,
  );
}

export function getTopOutstanding() {
  return apiFetch<OutstandingParticipant[]>(
    "/reports/outstanding",
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

export type ReportDateRange = {
  from?: string;
  to?: string;
};