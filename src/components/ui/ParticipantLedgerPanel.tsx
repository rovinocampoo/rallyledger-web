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
};

type LedgerStatementProps = {
  participant: Participant;
  ledger: ParticipantLedger;
};

function getBalanceLabel(balance: number) {
  if (balance > 0) {
    return "Owes";
  }

  if (balance < 0) {
    return "Credit";
  }

  return "Settled";
}

function waitForRender() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function LedgerStatement({ participant, ledger }: LedgerStatementProps) {
  return (
    <div className="w-[700px] bg-zinc-950 p-10 text-white">
      <div className="border-b border-zinc-800 pb-6">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          RallyLedger
        </p>

        <p className="mt-1 text-sm text-zinc-400">Participant Ledger</p>

        <h2 className="mt-4 text-3xl font-bold">
          {formatFullName(participant.firstName, participant.lastName)}
        </h2>

        {participant.nickname && (
          <p className="mt-1 text-zinc-400">{participant.nickname}</p>
        )}

        <p className="mt-3 text-xs text-zinc-500">
          Generated {formatDate(new Date().toISOString().slice(0, 10))}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Total Charges</p>

          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(ledger.totalCharges)}
          </p>
        </div>

        <div className="rounded-xl bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Total Payments</p>

          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(ledger.totalPayments)}
          </p>
        </div>

        <div className="rounded-xl bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Balance</p>

          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(ledger.balance)}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {getBalanceLabel(ledger.balance)}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold">Charges</h3>

        <div className="mt-3 space-y-2">
          {ledger.charges.length === 0 ? (
            <p className="text-sm text-zinc-500">No charges recorded.</p>
          ) : (
            ledger.charges.map((charge) => (
              <div
                key={charge.id}
                className="flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{formatLabel(charge.feeType)}</p>

                  <p className="text-xs text-zinc-500">
                    {formatDate(charge.chargeDate)}
                  </p>
                </div>

                <p className="font-semibold">{formatCurrency(charge.amount)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold">Payments</h3>

        <div className="mt-3 space-y-2">
          {ledger.payments.length === 0 ? (
            <p className="text-sm text-zinc-500">No payments recorded.</p>
          ) : (
            ledger.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-3"
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

      <div className="mt-8 border-t border-zinc-800 pt-5 text-xs text-zinc-500">
        Generated by RallyLedger - kurovin :D
      </div>
    </div>
  );
}

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
function ParticipantLedgerPanel({
  participant,
  onClose,
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
  const statementRef = useRef<HTMLDivElement | null>(null);
  const [sharingLedger, setSharingLedger] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [renderStatement, setRenderStatement] = useState(false);

  async function loadLedger() {
    try {
      const data = await getParticipantLedger(participant.id);
      setLedger(data);
    } catch (err) {
      console.error(err);
      setPaymentError("Failed to refresh ledger");
    }
  }

  async function handlePaymentSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmittingPayment(true);
      setPaymentError(null);

      await createPayment({
        participantId: participant.id,
        amount: Number(amount),
        paymentMethod,
        reference: reference.trim() === "" ? null : reference,
        paymentDate,
      });

      await loadLedger();

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
    } catch (err) {
      console.error(err);
      setPaymentError("Failed to delete payment");
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

  if (loading) {
    return (
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-zinc-400">Loading ledger...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-red-400">{error}</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 text-sm text-zinc-400"
        >
          Close
        </button>
      </div>
    );
  }

  if (!ledger) {
    return null;
  }

  const chargesByType = ledger.charges.reduce<Record<string, number>>(
    (totals, charge) => {
      totals[charge.feeType] = (totals[charge.feeType] ?? 0) + charge.amount;

      return totals;
    },
    {},
  );

  const chargesByDate = ledger.charges.reduce<Record<string, number>>(
    (totals, charge) => {
      totals[charge.chargeDate] =
        (totals[charge.chargeDate] ?? 0) + charge.amount;

      return totals;
    },
    {},
  );

  function buildLedgerStatement() {
    if (!ledger) {
      return "";
    }

    const chargeLines = ledger.charges.map(
      (charge) =>
        `${formatDate(charge.chargeDate)} — ${formatLabel(charge.feeType)}: ${formatCurrency(charge.amount)}`,
    );

    const paymentLines = ledger.payments.map((payment) => {
      const reference = payment.reference ? ` (${payment.reference})` : "";

      return `${formatDate(payment.paymentDate)} — ${formatLabel(payment.paymentMethod)}: ${formatCurrency(payment.amount)}${reference}`;
    });

    return [
      "RALLYLEDGER",
      "",
      `Participant: ${formatFullName(participant.firstName, participant.lastName)}`,
      participant.nickname ? `Nickname: ${participant.nickname}` : null,
      "",
      `Total Charges: ${formatCurrency(ledger.totalCharges)}`,
      `Total Payments: ${formatCurrency(ledger.totalPayments)}`,
      `Balance: ${formatCurrency(ledger.balance)} (${getBalanceLabel(ledger.balance)})`,
      "",
      "CHARGES",
      ...(chargeLines.length > 0 ? chargeLines : ["No charges recorded."]),
      "",
      "PAYMENTS",
      ...(paymentLines.length > 0 ? paymentLines : ["No payments recorded."]),
      "",
      `Generated: ${formatDate(new Date().toISOString().slice(0, 10))}`,
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

      await navigator.clipboard.writeText(text);

      setShareMessage("Ledger text copied.");
    } catch (err) {
      console.error(err);
      setShareMessage("Failed to copy ledger text.");
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-400">Ledger</p>

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
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
          <button
            type="button"
            onClick={() => setShowPaymentForm(true)}
            className="w-full rounded-lg bg-white px-3 py-2 text-sm sm:w-auto text-black"
          >
            Add Payment
          </button>
          <button
            type="button"
            onClick={handleShareLedgerPng}
            disabled={sharingLedger}
            className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm sm:w-auto text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sharingLedger ? "Preparing..." : "Share as PNG"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm sm:w-auto text-zinc-400"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleCopyLedgerText}
            className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm sm:w-auto text-zinc-200 hover:bg-zinc-800"
          >
            Copy as Text
          </button>
        </div>
      </div>{" "}
      {showPaymentForm && (
        <form
          onSubmit={handlePaymentSubmit}
          className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-4"
        >
          <h3 className="mb-4 font-semibold">Record Payment</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm text-zinc-400">Amount</span>

              <input
                type="number"
                min="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </label>

            <label>
              <span className="text-sm text-zinc-400">Payment Method</span>

              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
              >
                <option value="CASH">Cash</option>
                <option value="GCASH">GCash</option>
                <option value="MAYA">Maya</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>

            <label>
              <span className="text-sm text-zinc-400">Payment Date</span>

              <input
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </label>

            <label>
              <span className="text-sm text-zinc-400">Reference</span>

              <input
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
              />
            </label>
          </div>

          {paymentError && (
            <p className="mt-4 text-sm text-red-400">{paymentError}</p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={submittingPayment}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              {submittingPayment ? "Recording..." : "Record Payment"}
            </button>

            <button
              type="button"
              onClick={() => setShowPaymentForm(false)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {shareMessage && (
        <p className="mt-3 text-sm text-zinc-400">{shareMessage}</p>
      )}
      <div className="grid gap-2 grid-cols-3">
        <div className="rounded-lg bg-zinc-950 p-4 sm:p-5">
          <p className="text-sm text-zinc-400">Total Charges</p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(ledger.totalCharges)}
          </p>
        </div>

        <div className="rounded-lg bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">Total Payments</p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(ledger.totalPayments)}
          </p>
        </div>

        <div className="rounded-lg bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">Balance</p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(ledger.balance)}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {getBalanceLabel(ledger.balance)}
          </p>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="mb-3 text-lg font-semibold">Charges</h3>

        {ledger.charges.length === 0 ? (
          <p className="text-sm text-zinc-500">No charges yet.</p>
        ) : (
          <div className="space-y-2">
            {ledger.charges.map((charge) => (
              <div
                key={charge.id}
                className="flex items-center justify-between rounded-lg bg-zinc-950 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{formatLabel(charge.feeType)}</p>

                  <p className="text-xs text-zinc-500">
                    {formatDate(charge.chargeDate)}
                  </p>
                </div>

                <p className="font-semibold">{formatCurrency(charge.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-zinc-950 p-4">
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
                  <span className="text-zinc-400">{formatLabel(feeType)}</span>

                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-950 p-4">
          <h3 className="font-semibold">Charges by Date</h3>

          <div className="mt-3 space-y-2">
            {Object.entries(chargesByDate).length === 0 ? (
              <p className="text-sm text-zinc-500">No charges yet.</p>
            ) : (
              Object.entries(chargesByDate)
                .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                .map(([date, amount]) => {
                  const dateCharges = ledger.charges.filter(
                    (charge) => charge.chargeDate === date,
                  );

                  const isExpanded = expandedChargeDate === date;

                  return (
                    <div
                      key={formatDate(date)}
                      className="rounded-lg bg-zinc-900"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedChargeDate(isExpanded ? null : date)
                        }
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                      >
                        <span className="text-zinc-400">
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
                        <div className="border-t border-zinc-800 px-3 py-2">
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
      <div className="mt-6">
        <h3 className="mb-3 text-lg font-semibold">Payments</h3>

        {ledger.payments.length === 0 ? (
          <p className="text-sm text-zinc-500">No payments yet.</p>
        ) : (
          <div className="space-y-2">
            {ledger.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg bg-zinc-950 px-4 py-3"
              >
                <div>
                  <p className="font-medium">
                    {formatLabel(payment.paymentMethod)}
                  </p>

                  <p className="text-xs text-zinc-500">
                    {formatDate(payment.paymentDate)}
                  </p>
                  {payment.reference && (
                    <p className="mt-1 text-xs text-zinc-600">
                      Ref: {payment.reference}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <p className="font-semibold">
                    {formatCurrency(payment.amount)}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleDeletePayment(payment.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {renderStatement && (
        <div className="fixed left-[-10000px] top-0" aria-hidden="true">
          <div ref={statementRef}>
            <LedgerStatement participant={participant} ledger={ledger} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ParticipantLedgerPanel;
