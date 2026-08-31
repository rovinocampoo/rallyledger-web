import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { toBlob } from "html-to-image";
import { getParticipantLedger } from "../../api/ledger";
import type { Participant } from "../../types/participant";
import type { ParticipantLedger } from "../../types/ledger";
import {
  formatCurrency,
  formatFullName,
  formatLabel,
  formatDate,
} from "../../utils/format";
import { createPayment, deletePayment } from "../../api/payments";

type ParticipantLedgerPanelProps = {
  participant: Participant;
  onClose: () => void;
  onLedgerChanged?: () => void | Promise<void>;
};

type LedgerStatementProps = {
  participant: Participant;
  periodLabel: string;
  openingBalance: number;
  charges: ParticipantLedger["charges"];
  payments: ParticipantLedger["payments"];
  chargeTotal: number;
  paymentTotal: number;
  closingBalance: number;
};

type StatementPeriod =
  | "THIS_WEEK"
  | "LAST_7_DAYS"
  | "THIS_MONTH"
  | "LAST_30_DAYS"
  | "FULL_HISTORY";

function getBalanceLabel(balance: number) {
  if (balance > 0) {
    return "Owes";
  }

  if (balance < 0) {
    return "Credit";
  }

  return "Settled";
}

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStatementRange(period: StatementPeriod) {
  const today = new Date();

  if (period === "FULL_HISTORY") {
    return {
      startDate: null,
      endDate: today,
    };
  }

  if (period === "LAST_30_DAYS") {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 29);

    return {
      startDate,
      endDate: today,
    };
  }

  if (period === "LAST_7_DAYS") {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6);

    return {
      startDate,
      endDate: today,
    };
  }
  if (period === "THIS_WEEK") {
    return {
      startDate: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - today.getDay(),
      ),
      endDate: today,
    };
  }

  return {
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
    endDate: today,
  };
}

function getStatementPeriodLabel(period: StatementPeriod) {
  if (period === "THIS_WEEK") {
    return "This Week";
  }

  if (period === "LAST_7_DAYS") {
    return "Last 7 Days";
  }

  if (period === "LAST_30_DAYS") {
    return "Last 30 Days";
  }

  if (period === "FULL_HISTORY") {
    return "Full History";
  }

  return "This Month";
}

function waitForRender() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function LedgerStatement({
  participant,
  periodLabel,
  openingBalance,
  charges,
  payments,
  chargeTotal,
  paymentTotal,
  closingBalance,
}: LedgerStatementProps) {
  const chargesByType = charges.reduce<Record<string, number>>(
    (totals, charge) => {
      totals[charge.feeType] = (totals[charge.feeType] ?? 0) + charge.amount;

      return totals;
    },
    {},
  );

  const chargesByDate = charges.reduce<Record<string, number>>(
    (totals, charge) => {
      totals[charge.chargeDate] =
        (totals[charge.chargeDate] ?? 0) + charge.amount;

      return totals;
    },
    {},
  );
  return (
    <div className="w-[700px] bg-white p-10 text-zinc-950">
      <div className="border-b border-zinc-200 pb-6">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          RallyLedger
        </p>

        <p className="mt-1 text-sm text-zinc-600">Participant Ledger</p>

        <h2 className="mt-4 text-3xl font-bold">
          {formatFullName(participant.firstName, participant.lastName)}
        </h2>

        {participant.nickname && (
          <p className="mt-1 text-zinc-600">{participant.nickname}</p>
        )}

        <p className="mt-3 text-sm text-zinc-600">Period: {periodLabel}</p>

        <p className="mt-1 text-xs text-zinc-500">
          Generated {formatDate(getTodayDate())}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-lg bg-zinc-50 p-4">
          <p className="text-sm text-zinc-600">Opening Balance</p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(openingBalance)}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {getBalanceLabel(openingBalance)}
          </p>
        </div>

        <div className="rounded-lg bg-zinc-50 p-4">
          <p className="text-sm text-zinc-600">Charges</p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(chargeTotal)}
          </p>
        </div>

        <div className="rounded-lg bg-zinc-50 p-4">
          <p className="text-sm text-zinc-600">Payments</p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(paymentTotal)}
          </p>
        </div>

        <div className="rounded-lg bg-zinc-50 p-4">
          <p className="text-sm text-zinc-600">Closing Balance</p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(closingBalance)}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {getBalanceLabel(closingBalance)}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-zinc-50 p-4">
          <h3 className="font-semibold">Charges by Type</h3>
          <div className="mt-3 space-y-2">
            {Object.entries(chargesByType).length === 0 ? (
              <p className="text-sm text-zinc-500">No charges yet.</p>
            ) : (
              Object.entries(chargesByType).map(([feeType, amount]) => (
                <div
                  key={feeType}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {formatLabel(feeType)}
                  </span>

                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-50 p-4">
          <h3 className="font-semibold">Charges by Date</h3>
          <div className="mt-3 space-y-2">
            {Object.entries(chargesByDate).length === 0 ? (
              <p className="text-sm text-zinc-500">No charges yet.</p>
            ) : (
              Object.entries(chargesByDate).map(([feeType, amount]) => (
                <div
                  key={feeType}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {formatLabel(feeType)}
                  </span>

                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold">Charge Details</h3>

        <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200">
          <div className="grid grid-cols-[minmax(0,1fr)_160px_120px] gap-4 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
            <span>Type</span>
            <span>Date</span>
            <span className="text-right">Amount</span>
          </div>

          {charges.map((charge) => (
            <div
              key={charge.id}
              className="grid grid-cols-[minmax(0,1fr)_160px_120px] gap-4 border-t border-zinc-200 px-4 py-3"
            >
              <span className="font-medium">{formatLabel(charge.feeType)}</span>

              <span className="text-zinc-600">
                {formatDate(charge.chargeDate)}
              </span>

              <span className="text-right font-semibold">
                {formatCurrency(charge.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-semibold">Payments</h3>

        <div className="mt-3 space-y-2">
          {payments.length === 0 ? (
            <p className="text-sm text-zinc-500">No payments recorded.</p>
          ) : (
            payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
              >
                <div>
                  <p className="font-medium">
                    {formatLabel(payment.paymentMethod)}
                  </p>

                  <p className="text-xs text-zinc-500">
                    {formatDate(payment.paymentDate)}
                  </p>

                  {payment.reference && (
                    <p className="mt-1 text-xs text-zinc-500">
                      Ref: {payment.reference}
                    </p>
                  )}
                </div>

                <p className="font-semibold">
                  {formatCurrency(payment.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="mt-8 border-t border-zinc-200 pt-5 text-xs text-zinc-500">
        Generated by RallyLedger · kurovin
      </div>
    </div>
  );
}

function ParticipantLedgerPanel({
  participant,
  onClose,
  onLedgerChanged,
}: ParticipantLedgerPanelProps) {
  const [ledger, setLedger] = useState<ParticipantLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(getTodayDate());
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [expandedChargeDate, setExpandedChargeDate] = useState<string | null>(
    null,
  );
  const [sharingLedger, setSharingLedger] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [renderStatement, setRenderStatement] = useState(false);
  const [statementPeriod, setStatementPeriod] =
    useState<StatementPeriod>("THIS_MONTH");
  const statementPeriodLabel = getStatementPeriodLabel(statementPeriod);

  const statementRef = useRef<HTMLDivElement | null>(null);
  const [showChargeDetails, setShowChargeDetails] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  async function loadLedger() {
    try {
      const data = await getParticipantLedger(participant.id);

      setLedger(data);
      setPaymentError(null);
    } catch (err) {
      console.error(err);
      setPaymentError("Failed to refresh ledger");
    }
  }

  useEffect(() => {
    let ignore = false;

    getParticipantLedger(participant.id)
      .then((data) => {
        if (!ignore) {
          setLedger(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError("Failed to load ledger");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [participant.id]);

  async function handlePaymentSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setPaymentError("Payment amount must be greater than zero.");
      return;
    }

    if (!paymentDate) {
      setPaymentError("Please select a payment date.");
      return;
    }

    try {
      setSubmittingPayment(true);
      setPaymentError(null);

      await createPayment({
        participantId: participant.id,
        amount: paymentAmount,
        paymentMethod,
        reference: reference.trim() || null,
        paymentDate,
      });

      await loadLedger();
      await onLedgerChanged?.();

      setAmount("");
      setPaymentMethod("CASH");
      setReference("");
      setPaymentDate(getTodayDate());
      setShowPaymentForm(false);
    } catch (err) {
      console.error(err);
      setPaymentError("Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  }
  async function handleDeletePayment(paymentId: number) {
    const confirmed = window.confirm("Delete this payment?");

    if (!confirmed) {
      return;
    }

    try {
      setPaymentError(null);

      await deletePayment(paymentId);
      await loadLedger();
      await onLedgerChanged?.();
    } catch (err) {
      console.error(err);
      setPaymentError("Failed to delete payment");
    }
  }

  function buildLedgerStatement() {
    if (!ledger) {
      return "";
    }

    const chargeLines = statementCharges.map(
      (charge) =>
        `${formatDate(charge.chargeDate)} — ${formatLabel(charge.feeType)}: ${formatCurrency(charge.amount)}`,
    );

    const chargeTypeLines = Object.entries(chargesByType)
      .sort(([typeA], [typeB]) => typeA.localeCompare(typeB))
      .map(
        ([feeType, amount]) =>
          `${formatLabel(feeType)}: ${formatCurrency(amount)}`,
      );

    const chargeDateLines = Object.entries(chargesByDate)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(
        ([date, amount]) => `${formatDate(date)}: ${formatCurrency(amount)}`,
      );

    const paymentLines = statementPayments.map((payment) => {
      const reference = payment.reference ? ` (${payment.reference})` : "";

      return `${formatDate(payment.paymentDate)} — ${formatLabel(payment.paymentMethod)}: ${formatCurrency(payment.amount)}${reference}`;
    });

    return [
      "RALLYLEDGER",
      "",
      `Participant: ${formatFullName(participant.firstName, participant.lastName)}`,
      participant.nickname ? `Nickname: ${participant.nickname}` : null,
      `Period: ${statementPeriodLabel}`,
      "",
      `Opening Balance: ${formatCurrency(openingBalance)} (${getBalanceLabel(openingBalance)})`,
      `Charges This Period: ${formatCurrency(statementChargeTotal)}`,
      `Payments This Period: ${formatCurrency(statementPaymentTotal)}`,
      `Closing Balance: ${formatCurrency(closingBalance)} (${getBalanceLabel(closingBalance)})`,
      "",
      "CHARGES BY TYPE",
      ...(chargeTypeLines.length > 0
        ? chargeTypeLines
        : ["No charges recorded."]),
      "",
      "CHARGES BY DATE",
      ...(chargeDateLines.length > 0
        ? chargeDateLines
        : ["No charges recorded."]),
      "",
      "CHARGES",
      ...(chargeLines.length > 0 ? chargeLines : ["No charges recorded."]),
      "",
      "PAYMENTS",
      ...(paymentLines.length > 0 ? paymentLines : ["No payments recorded."]),
      "",
      `Generated: ${formatDate(getTodayDate())}`,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");
  }

  async function generateLedgerPng() {
    if (!statementRef.current) {
      return null;
    }

    const blob = await toBlob(statementRef.current, {
      cacheBust: true,
      pixelRatio: 2,
    });

    if (!blob) {
      return null;
    }

    const safeName = `${participant.firstName}-${participant.lastName}`
      .toLowerCase()
      .replaceAll(" ", "-");

    return new File([blob], `rallyledger-${safeName}.png`, {
      type: "image/png",
    });
  }

  async function handleShareLedgerPng() {
    if (!ledger) {
      return;
    }

    try {
      setSharingLedger(true);
      setShareMessage(null);
      setRenderStatement(true);

      await waitForRender();

      const pngFile = await generateLedgerPng();

      if (!pngFile) {
        setShareMessage("Failed to generate ledger PNG.");
        return;
      }

      if (
        navigator.share &&
        navigator.canShare?.({
          files: [pngFile],
        })
      ) {
        await navigator.share({
          title: "RallyLedger Participant Ledger",
          text: `Ledger statement for ${formatFullName(
            participant.firstName,
            participant.lastName,
          )}`,
          files: [pngFile],
        });

        return;
      }

      const url = URL.createObjectURL(pngFile);

      const link = document.createElement("a");
      link.href = url;
      link.download = pngFile.name;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      setShareMessage("Ledger PNG saved.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      console.error(err);
      setShareMessage("Failed to share ledger PNG.");
    } finally {
      setSharingLedger(false);
      setRenderStatement(false);
    }
  }

  async function handleCopyLedgerText() {
    try {
      setShareMessage(null);

      const text = buildLedgerStatement();

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);

        setShareMessage("Ledger text copied.");
        return;
      }

      const textArea = document.createElement("textarea");

      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";

      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();

      const copied = document.execCommand("copy");

      document.body.removeChild(textArea);

      if (!copied) {
        throw new Error("Clipboard copy failed");
      }

      setShareMessage("Ledger text copied.");
    } catch (err) {
      console.error(err);
      setShareMessage("Failed to copy ledger text.");
    }
  }

  if (loading) {
    return (
      <div className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <p className="text-zinc-600 dark:text-zinc-400">Loading ledger...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <p className="text-red-400">{error}</p>

        <button
          type="button"
          onClick={onClose}
          className="danger-action mt-3 text-sm text-zinc-600 dark:text-zinc-400"
        >
          Close
        </button>
      </div>
    );
  }

  if (!ledger) {
    return null;
  }

  const { startDate, endDate } = getStatementRange(statementPeriod);

  function isBeforeStart(dateValue: string) {
    if (!startDate) {
      return false;
    }

    return new Date(dateValue) < startDate;
  }

  function isWithinStatementPeriod(dateValue: string) {
    const date = new Date(dateValue);

    if (!startDate) {
      return date <= endDate;
    }

    return date >= startDate && date <= endDate;
  }

  const openingCharges = ledger.charges
    .filter((charge) => isBeforeStart(charge.chargeDate))
    .reduce((total, charge) => total + charge.amount, 0);

  const openingPayments = ledger.payments
    .filter((payment) => isBeforeStart(payment.paymentDate))
    .reduce((total, payment) => total + payment.amount, 0);

  const openingBalance = openingCharges - openingPayments;

  const statementCharges = ledger.charges.filter((charge) =>
    isWithinStatementPeriod(charge.chargeDate),
  );

  const statementPayments = ledger.payments.filter((payment) =>
    isWithinStatementPeriod(payment.paymentDate),
  );

  const statementChargeTotal = statementCharges.reduce(
    (total, charge) => total + charge.amount,
    0,
  );

  const statementPaymentTotal = statementPayments.reduce(
    (total, payment) => total + payment.amount,
    0,
  );

  const closingBalance =
    openingBalance + statementChargeTotal - statementPaymentTotal;

  const chargesByType = statementCharges.reduce<Record<string, number>>(
    (totals, charge) => {
      totals[charge.feeType] = (totals[charge.feeType] ?? 0) + charge.amount;

      return totals;
    },
    {},
  );

  const chargesByDate = statementCharges.reduce<Record<string, number>>(
    (totals, charge) => {
      totals[charge.chargeDate] =
        (totals[charge.chargeDate] ?? 0) + charge.amount;

      return totals;
    },
    {},
  );

  return (
    <div className="mx-auto mb-6 max-w-6xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Ledger</p>

          <h2
            className="truncate text-xl font-semibold"
            title={formatFullName(participant.firstName, participant.lastName)}
          >
            {formatFullName(participant.firstName, participant.lastName)}
          </h2>

          {participant.nickname && (
            <p
              className="mt-1 truncate text-sm text-zinc-500"
              title={participant.nickname}
            >
              {participant.nickname}
            </p>
          )}

          <div className="mt-4">
            <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Period
            </label>

            <select
              value={statementPeriod}
              onChange={(event) =>
                setStatementPeriod(event.target.value as StatementPeriod)
              }
              className="mt-2 secondary-action rounded-lg px-3 py-2 text-sm"
            >
              <option value="THIS_WEEK">This Week</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="FULL_HISTORY">Full History</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={handleShareLedgerPng}
            disabled={sharingLedger}
            className="secondary-action rounded-lg px-3 py-2 text-sm"
          >
            {sharingLedger ? "Preparing..." : "Share as PNG"}
          </button>

          <button
            type="button"
            onClick={handleCopyLedgerText}
            className="secondary-action rounded-lg px-3 py-2 text-sm"
          >
            Copy as Text
          </button>

          <button
            type="button"
            onClick={() => setShowPaymentForm(true)}
            className="primary-action rounded-lg px-3 py-2 text-sm"
          >
            Add Payment
          </button>

          <button
            type="button"
            onClick={onClose}
            className="danger-action rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400"
          >
            Close
          </button>
        </div>
      </div>
      {showPaymentForm && (
        <form
          onSubmit={handlePaymentSubmit}
          className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4"
        >
          <h3 className="mb-4 font-semibold">Record Payment</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Amount
              </span>

              <input
                type="number"
                min="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              />
            </label>

            <label>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Payment Method
              </span>

              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              >
                <option value="CASH">Cash</option>
                <option value="GCASH">GCash</option>
                <option value="MAYA">Maya</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>

            <label>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Payment Date
              </span>

              <input
                type="date"
                required
                max={getTodayDate()}
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>

            <label>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Reference
              </span>

              <input
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              />
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={submittingPayment}
              className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {submittingPayment ? "Recording..." : "Record Payment"}
            </button>

            <button
              type="button"
              onClick={() => setShowPaymentForm(false)}
              className="transition-colors rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {paymentError && (
        <p className="mt-4 text-sm text-red-400">{paymentError}</p>
      )}
      {shareMessage && (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {shareMessage}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Opening Balance
          </p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(openingBalance)}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {getBalanceLabel(openingBalance)}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Charges</p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(statementChargeTotal)}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Payments</p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(statementPaymentTotal)}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Closing Balance
          </p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(closingBalance)}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {getBalanceLabel(closingBalance)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4">
          <h3 className="font-semibold">Charges by Type</h3>
          <div className="mt-3 space-y-2">
            {Object.entries(chargesByType).length === 0 ? (
              <p className="text-sm text-zinc-500">No charges yet.</p>
            ) : (
              Object.entries(chargesByType).map(([feeType, amount]) => (
                <div
                  key={feeType}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {formatLabel(feeType)}
                  </span>

                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4">
          <h3 className="font-semibold">Charges by Date</h3>

          <div className="mt-3 space-y-2">
            {Object.entries(chargesByDate).length === 0 ? (
              <p className="text-sm text-zinc-500">No charges yet.</p>
            ) : (
              Object.entries(chargesByDate)
                .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                .map(([date, amount]) => {
                  const dateCharges = statementCharges.filter(
                    (charge) => charge.chargeDate === date,
                  );

                  const isExpanded = expandedChargeDate === date;

                  return (
                    <div
                      key={formatDate(date)}
                      className="rounded-lg bg-white dark:bg-zinc-900"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedChargeDate(isExpanded ? null : date)
                        }
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                      >
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {formatDate(date)}
                        </span>

                        <div className="flex items-center gap-3">
                          <span className="font-medium">
                            {formatCurrency(amount)}
                          </span>

                          <span className="text-xs text-zinc-500">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-2">
                          <div className="space-y-2">
                            {dateCharges.map((charge) => (
                              <div
                                key={charge.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-zinc-500">
                                  {formatLabel(charge.feeType)}
                                </span>

                                <span>{formatCurrency(charge.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setShowChargeDetails((current) => !current)}
          className="flex w-full items-center justify-between gap-4 bg-zinc-50 px-4 py-3 text-left transition-colors hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800"
        >
          <div>
            <p className="font-semibold">Charge Details</p>

            <p className="mt-1 text-xs text-zinc-500">
              {statementCharges.length}{" "}
              {statementCharges.length === 1 ? "charge" : "charges"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold">
              {formatCurrency(statementChargeTotal)}
            </span>

            <span className="text-xs text-zinc-500">
              {showChargeDetails ? "▲" : "▼"}
            </span>
          </div>
        </button>

        {showChargeDetails && (
          <div>
            {/* DESKTOP HEADER */}
            <div className="hidden grid-cols-[minmax(0,1fr)_160px_120px] gap-4 border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 md:grid">
              <span>Type</span>
              <span>Date</span>
              <span className="text-right">Amount</span>
            </div>

            {statementCharges.length === 0 ? (
              <p className="border-t border-zinc-200 px-4 py-4 text-sm text-zinc-500 dark:border-zinc-800">
                No charges recorded.
              </p>
            ) : (
              statementCharges.map((charge) => (
                <div
                  key={charge.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-zinc-200 bg-white px-4 py-3 text-left dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-[minmax(0,1fr)_160px_120px]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {formatLabel(charge.feeType)}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500 md:hidden">
                      {formatDate(charge.chargeDate)}
                    </p>
                  </div>

                  <p className="hidden text-sm text-zinc-500 md:block">
                    {formatDate(charge.chargeDate)}
                  </p>

                  <p className="text-right font-semibold">
                    {formatCurrency(charge.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setShowPaymentDetails((current) => !current)}
          className="flex w-full items-center justify-between gap-4 bg-zinc-50 px-4 py-3 text-left transition-colors hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800"
        >
          <div>
            <p className="font-semibold">Payments</p>

            <p className="mt-1 text-xs text-zinc-500">
              {statementPayments.length}{" "}
              {statementPayments.length === 1 ? "payment" : "payments"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold">
              {formatCurrency(statementPaymentTotal)}
            </span>

            <span className="text-xs text-zinc-500">
              {showPaymentDetails ? "▲" : "▼"}
            </span>
          </div>
        </button>

        {showPaymentDetails && (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {statementPayments.length === 0 ? (
              <p className="px-4 py-4 text-sm text-zinc-500">
                No payments yet.
              </p>
            ) : (
              statementPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-4 bg-white px-4 py-3 dark:bg-zinc-900"
                >
                  <div className="min-w-0 text-left">
                    <p className="font-medium">
                      {formatLabel(payment.paymentMethod)}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {formatDate(payment.paymentDate)}
                    </p>

                    {payment.reference && (
                      <p className="mt-1 truncate text-xs text-zinc-500">
                        Ref: {payment.reference}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <p className="font-semibold">
                      {formatCurrency(payment.amount)}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleDeletePayment(payment.id)}
                      className="danger-text text-xs text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {renderStatement && (
        <div className="fixed left-[-10000px] top-0" aria-hidden="true">
          <div ref={statementRef}>
            <LedgerStatement
              participant={participant}
              periodLabel={statementPeriodLabel}
              openingBalance={openingBalance}
              charges={statementCharges}
              payments={statementPayments}
              chargeTotal={statementChargeTotal}
              paymentTotal={statementPaymentTotal}
              closingBalance={closingBalance}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ParticipantLedgerPanel;
