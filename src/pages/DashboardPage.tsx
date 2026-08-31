import { useEffect, useState } from "react";
import {
  getReportSummary,
  getOutstanding,
  getPaymentReport,
  type ReportDateRange,
} from "../api/reports";
import type {
  OutstandingParticipant,
  ReportSummary,
  PaymentReport,
} from "../types/report";
import { formatCurrency, formatFullName, formatLabel } from "../utils/format";
import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../components/layout/AppLayout";

type DateFilter = "ALL_TIME" | "TODAY" | "THIS_MONTH" | "CUSTOM";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildDateRange(
  filter: DateFilter,
  customFrom: string,
  customTo: string,
) {
  const today = new Date();

  if (filter === "TODAY") {
    const date = formatDateInput(today);

    return {
      from: date,
      to: date,
    };
  }

  if (filter === "THIS_MONTH") {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      from: formatDateInput(firstDay),
      to: formatDateInput(today),
    };
  }

  if (filter === "CUSTOM") {
    return {
      from: customFrom || undefined,
      to: customTo || undefined,
    };
  }

  return undefined;
}

function isSameDateRange(
  first: ReportDateRange | undefined,
  second: ReportDateRange | undefined,
) {
  return first?.from === second?.from && first?.to === second?.to;
}

function DashboardPage() {
  const { organization } = useOutletContext<AppOutletContext>();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outstandingParticipants, setOutstandingParticipants] = useState<
    OutstandingParticipant[]
  >([]);
  const navigate = useNavigate();
  const [paymentReport, setPaymentReport] = useState<PaymentReport | null>(
    null,
  );
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL_TIME");

  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [filterError, setFilterError] = useState<string | null>(null);
  const [appliedDateRange, setAppliedDateRange] = useState<
    ReportDateRange | undefined
  >(undefined);

  function handleApplyFilter() {
    if (!customFrom || !customTo) {
      setFilterError("Please select both From and To dates.");
      return;
    }

    if (customFrom > customTo) {
      setFilterError("From date cannot be after To date.");
      return;
    }

    setFilterError(null);

    const nextDateRange = buildDateRange(dateFilter, customFrom, customTo);

    if (isSameDateRange(nextDateRange, appliedDateRange)) {
      return;
    }

    setLoading(true);
    setError(null);
    setAppliedDateRange(nextDateRange);
  }

  function handlePresetFilter(filter: DateFilter) {
    setDateFilter(filter);
    setFilterError(null);

    if (filter === "CUSTOM") {
      return;
    }

    const nextDateRange = buildDateRange(filter, customFrom, customTo);

    if (isSameDateRange(nextDateRange, appliedDateRange)) {
      return;
    }

    setLoading(true);
    setError(null);
    setAppliedDateRange(nextDateRange);
  }

  useEffect(() => {
    let ignore = false;

    Promise.all([
      getReportSummary(appliedDateRange),
      getOutstanding(5),
      getPaymentReport(appliedDateRange),
    ])
      .then(([summaryData, outstandingData, paymentData]) => {
        if (!ignore) {
          setSummary(summaryData);
          setOutstandingParticipants(outstandingData);
          setPaymentReport(paymentData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError("Failed to load dashboard");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [appliedDateRange]);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!summary) {
    return <p>No dashboard data available.</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {organization
            ? `${organization.name} overview.`
            : "Organization overview."}
        </p>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          ["ALL_TIME", "All Time"],
          ["TODAY", "Today"],
          ["THIS_MONTH", "This Month"],
          ["CUSTOM", "Custom"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => handlePresetFilter(value as DateFilter)}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              dateFilter === value
                ? "bg-zinc-950 text-white dark:bg-white dark:text-black"
                : "bg-white text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {dateFilter === "CUSTOM" && (
        <div className="mb-6 flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">From</label>

            <input
              type="date"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500">To</label>

            <input
              type="date"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
            />
          </div>
          <button
            type="button"
            onClick={handleApplyFilter}
            className="primary-action self-end rounded-lg px-4 py-2 text-sm font-medium"
          >
            Apply
          </button>
          {filterError && (
            <p className="w-full text-sm text-red-400">{filterError}</p>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Participants
          </p>

          <p className="mt-2 text-3xl font-bold">{summary.participantCount}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Sessions</p>

          <p className="mt-2 text-3xl font-bold">{summary.sessionCount}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Matches</p>

          <p className="mt-2 text-3xl font-bold">{summary.matchCount}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Total Charges
          </p>

          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(summary.totalCharges)}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Total Payments
          </p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(summary.totalPayments)}
          </p>{" "}
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Net Balance
          </p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(summary.outstandingBalance)}
          </p>
        </div>
      </div>
      <div className="mt-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Top Outstanding</h2>

          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Participants with the highest unpaid balances.
          </p>
        </div>

        {outstandingParticipants.length === 0 ? (
          <p className="text-sm text-zinc-500">No outstanding balances.</p>
        ) : (
          <div className="space-y-2">
            {outstandingParticipants.map((participant) => (
              <button
                key={participant.participantId}
                type="button"
                onClick={() =>
                  navigate("/participants", {
                    state: {
                      ledgerParticipantId: participant.participantId,
                    },
                  })
                }
                className="flex w-full items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 text-left transition-colors hover:bg-zinc-200 dark:bg-zinc-950 dark:hover:bg-zinc-800"
              >
                <div>
                  <p className="font-medium">
                    {formatFullName(
                      participant.firstName,
                      participant.lastName,
                    )}
                  </p>

                  {participant.nickname && (
                    <p className="text-xs text-zinc-500">
                      {participant.nickname}
                    </p>
                  )}
                </div>

                <p className="font-semibold">
                  {formatCurrency(participant.balance)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Payment Report */}
      {paymentReport && (
        <div className="mt-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Payments Overview</h2>

            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Breakdown of recorded payments by method.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Total Payments
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatCurrency(paymentReport.totalPayments)}
              </p>
            </div>

            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Payment Records
              </p>

              <p className="mt-2 text-2xl font-bold">
                {paymentReport.paymentCount}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2 text-left">
            {paymentReport.byMethod.length === 0 ? (
              <p className="text-sm text-zinc-500">No payments recorded yet.</p>
            ) : (
              paymentReport.byMethod.map((method) => (
                <div
                  key={method.paymentMethod}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-950 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {formatLabel(method.paymentMethod)}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {method.paymentCount}{" "}
                      {method.paymentCount === 1 ? "payment" : "payments"}
                    </p>
                  </div>

                  <p className="font-semibold">
                    {formatCurrency(method.totalAmount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
