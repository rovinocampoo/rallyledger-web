import { useEffect, useState } from "react";
import { getFinancialReport, type ReportDateRange } from "../api/reports";
import type { FinancialReport } from "../types/report";
import FinancialTrendChart from "../components/ui/FinancialTrendChart";
import { formatCurrency, formatLabel } from "../utils/format";
import { escapeCsvValue } from "../utils/csv";

type DateFilter = "ALL_TIME" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";

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
): ReportDateRange | undefined {
  const today = new Date();

  if (filter === "TODAY") {
    const date = formatDateInput(today);

    return {
      from: date,
      to: date,
    };
  }

  if (filter === "THIS_WEEK") {
    const day = today.getDay();
    const difference = day === 0 ? -6 : 1 - day;

    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() + difference);

    return {
      from: formatDateInput(firstDay),
      to: formatDateInput(today),
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

function formatPeriod(
  filter: DateFilter,
  dateRange: ReportDateRange | undefined,
) {
  if (filter === "ALL_TIME") {
    return "All time";
  }

  if (!dateRange?.from || !dateRange?.to) {
    return "Select a date range";
  }

  const from = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(`${dateRange.from}T00:00:00`));

  const to = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(`${dateRange.to}T00:00:00`));

  return from === to ? from : `${from} – ${to}`;
}

function getPreviousDateRange(
  filter: DateFilter,
  dateRange: ReportDateRange | undefined,
): ReportDateRange | undefined {
  if (filter === "ALL_TIME" || !dateRange?.from || !dateRange?.to) {
    return undefined;
  }

  const from = new Date(`${dateRange.from}T00:00:00`);
  const to = new Date(`${dateRange.to}T00:00:00`);

  const dayCount = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;

  const previousTo = new Date(from);
  previousTo.setDate(previousTo.getDate() - 1);

  const previousFrom = new Date(previousTo);
  previousFrom.setDate(previousFrom.getDate() - dayCount + 1);

  return {
    from: formatDateInput(previousFrom),
    to: formatDateInput(previousTo),
  };
}

function getComparisonText(current: number, previous: number) {
  if (previous === 0 && current === 0) {
    return "No change";
  }

  if (previous === 0) {
    return "New activity";
  }

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.abs(change).toFixed(1);

  if (change > 0) {
    return `↑ ${rounded}% vs previous period`;
  }

  if (change < 0) {
    return `↓ ${rounded}% vs previous period`;
  }

  return "No change vs previous period";
}

function FinancialReportPage() {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [previousReport, setPreviousReport] = useState<FinancialReport | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL_TIME");

  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [filterError, setFilterError] = useState<string | null>(null);

  const [appliedDateRange, setAppliedDateRange] = useState<
    ReportDateRange | undefined
  >(undefined);

  useEffect(() => {
    let ignore = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    const previousDateRange = getPreviousDateRange(
      dateFilter,
      appliedDateRange,
    );

    Promise.all([
      getFinancialReport(appliedDateRange),
      previousDateRange
        ? getFinancialReport(previousDateRange)
        : Promise.resolve(null),
    ])
      .then(([currentData, previousData]) => {
        if (!ignore) {
          setReport(currentData);
          setPreviousReport(previousData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError("Failed to load financial report");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [appliedDateRange, dateFilter]);

  function handlePresetFilter(filter: DateFilter) {
    setDateFilter(filter);
    setFilterError(null);

    if (filter === "CUSTOM") {
      return;
    }

    setAppliedDateRange(buildDateRange(filter, customFrom, customTo));
  }

  function handleApplyCustom() {
    if (!customFrom || !customTo) {
      setFilterError("Please select both From and To dates.");
      return;
    }

    if (customFrom > customTo) {
      setFilterError("From date cannot be after To date.");
      return;
    }

    setFilterError(null);

    setAppliedDateRange(buildDateRange("CUSTOM", customFrom, customTo));
  }

  function handleExportCsv() {
    if (!report) {
      return;
    }

    const rows: (string | number)[][] = [
      ["Financial Report"],
      ["Period", formatPeriod(dateFilter, appliedDateRange)],
      [],
      ["Summary"],
      ["Total Charges", report.totalCharges],
      ["Total Payments", report.totalPayments],
      ["Net Activity", report.netActivity],
      ["Outstanding Balance", report.outstandingBalance],
      ["Outstanding Participants", report.outstandingParticipantCount],
      ["Credit Balance", report.creditBalance],
      ["Credit Participants", report.creditParticipantCount],
      [],
      ["Financial Activity"],
      ["Date", "Charges", "Payments"],
      ...report.trend.map((item) => [item.date, item.charges, item.payments]),
      ["Collections by Payment Method"],
      ["Payment Method", "Payment Count", "Total Amount"],
      ...report.byPaymentMethod.map((item) => [
        formatLabel(item.paymentMethod),
        item.paymentCount,
        item.totalAmount,
      ]),
      [],
      ["Charges by Type"],
      ["Fee Type", "Charge Count", "Total Amount"],
      ...report.byChargeType.map((item) => [
        formatLabel(item.feeType),
        item.chargeCount,
        item.totalAmount,
      ]),
      [],
      ["Charge Adjustments"],
      ["Adjustment Count", report.adjustments.adjustmentCount],
      ["Increase Amount", report.adjustments.increaseAmount],
      ["Decrease Amount", report.adjustments.decreaseAmount],
      ["Net Adjustment", report.adjustments.netAmount],
    ];

    const csv = rows
      .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;

    const today = formatDateInput(new Date());

    link.download = `financial-report-${today}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <p>Loading financial report...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!report) {
    return <p>No financial report data available.</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Financial Report</h1>

          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Period activity and balances.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="secondary-action rounded-lg px-4 py-2 text-sm font-medium"
        >
          Export CSV
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap gap-2">
          {[
            ["ALL_TIME", "All Time"],
            ["TODAY", "Daily"],
            ["THIS_WEEK", "Weekly"],
            ["THIS_MONTH", "Monthly"],
            ["CUSTOM", "Custom"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => handlePresetFilter(value as DateFilter)}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                dateFilter === value
                  ? "bg-zinc-950 text-white dark:bg-white dark:text-black"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {dateFilter === "CUSTOM" && (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">From</label>

              <input
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                className="dark:[color-scheme:dark] rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-500">To</label>

              <input
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                className="dark:[color-scheme:dark] rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <button
              type="button"
              onClick={handleApplyCustom}
              className="primary-action rounded-lg px-4 py-2 text-sm font-medium"
            >
              Apply
            </button>

            {filterError && (
              <p className="w-full text-sm text-red-400">{filterError}</p>
            )}
          </div>
        )}

        <p className="mt-4 text-sm text-zinc-500">
          {formatPeriod(dateFilter, appliedDateRange)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Charges",
            amount: report.totalCharges,
            previous: previousReport?.totalCharges,
          },
          {
            label: "Payments",
            amount: report.totalPayments,
            previous: previousReport?.totalPayments,
          },
          {
            label: "Net Activity",
            amount: report.netActivity,
            previous: previousReport?.netActivity,
          },
          {
            label: "Outstanding",
            amount: report.outstandingBalance,
          },
          {
            label: "Credits",
            amount: report.creditBalance,
          },
        ].map(({ label, amount, previous }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500">{label}</p>

            <p className="mt-2 text-2xl font-bold">
              {formatCurrency(Number(amount))}
            </p>
            {previousReport && previous !== undefined && (
              <p
                className={`mt-2 text-xs ${
                  amount >= previous
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {getComparisonText(Number(amount), previous)}
              </p>
            )}
          </div>
        ))}
      </div>
      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Reconciliation</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Period activity reconciled to participant balances at period end.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-zinc-500">Charges</p>
            <p className="mt-1 font-semibold">
              {formatCurrency(report.totalCharges)}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">Payments</p>
            <p className="mt-1 font-semibold">
              {formatCurrency(report.totalPayments)}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">Net Activity</p>
            <p className="mt-1 font-semibold">
              {formatCurrency(report.netActivity)}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">Outstanding</p>
            <p className="mt-1 font-semibold">
              {formatCurrency(report.outstandingBalance)}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">Credits</p>
            <p className="mt-1 font-semibold">
              {formatCurrency(report.creditBalance)}
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-zinc-500">Outstanding − Credits</span>

            <span className="font-semibold">
              {formatCurrency(report.outstandingBalance - report.creditBalance)}
            </span>
          </div>
        </div>
      </section>
      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Financial Activity</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Charges and payments recorded during the selected period.
          </p>
        </div>

        <FinancialTrendChart data={report.trend} />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Collections by Payment Method
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Money collected during the selected period.
            </p>
          </div>

          {report.byPaymentMethod.length === 0 ? (
            <p className="text-sm text-zinc-500">No payments recorded.</p>
          ) : (
            <div className="space-y-2">
              {report.byPaymentMethod.map((item) => (
                <div
                  key={item.paymentMethod}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950"
                >
                  <div>
                    <p className="font-medium">
                      {formatLabel(item.paymentMethod)}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {item.paymentCount}{" "}
                      {item.paymentCount === 1 ? "payment" : "payments"}
                    </p>
                  </div>

                  <p className="font-semibold">
                    {formatCurrency(item.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Charges by Type</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Charges created during the selected period.
            </p>
          </div>

          {report.byChargeType.length === 0 ? (
            <p className="text-sm text-zinc-500">No charges recorded.</p>
          ) : (
            <div className="space-y-2">
              {report.byChargeType.map((item) => (
                <div
                  key={item.feeType}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950"
                >
                  <div>
                    <p className="font-medium">{formatLabel(item.feeType)}</p>

                    <p className="text-xs text-zinc-500">
                      {item.chargeCount}{" "}
                      {item.chargeCount === 1 ? "charge" : "charges"}
                    </p>
                  </div>

                  <p className="font-semibold">
                    {formatCurrency(item.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Balances & Adjustments</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Participant balances as of the period end, plus charge adjustments
            recorded in the period.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500">Participants Owing</p>

            <p className="mt-2 text-2xl font-bold">
              {report.outstandingParticipantCount}
            </p>
          </div>

          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500">Participants With Credit</p>

            <p className="mt-2 text-2xl font-bold">
              {report.creditParticipantCount}
            </p>
          </div>

          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500">Adjustments</p>

            <p className="mt-2 text-2xl font-bold">
              {report.adjustments.adjustmentCount}
            </p>
          </div>

          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500">Net Adjustments</p>

            <p className="mt-2 text-2xl font-bold">
              {formatCurrency(report.adjustments.netAmount)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-zinc-500">Adjustment Increase</p>

            <p className="mt-1 font-semibold">
              {formatCurrency(report.adjustments.increaseAmount)}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">Adjustment Decrease</p>

            <p className="mt-1 font-semibold">
              {formatCurrency(report.adjustments.decreaseAmount)}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">Credit Balance</p>

            <p className="mt-1 font-semibold">
              {formatCurrency(report.creditBalance)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FinancialReportPage;
