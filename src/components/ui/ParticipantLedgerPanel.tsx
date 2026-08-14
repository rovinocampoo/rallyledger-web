import { useEffect, useState, type SubmitEvent } from "react";
import { getParticipantLedger } from "../../api/ledger";
import type { Participant } from "../../types/participant";
import type { ParticipantLedger } from "../../types/ledger";
import { formatCurrency, formatFullName, formatLabel } from "../../utils/format";
import { createPayment, deletePayment } from "../../api/payments";

type ParticipantLedgerPanelProps = {
  participant: Participant;
  onClose: () => void;
};

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
  const [paymentDate, setPaymentDate] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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
      setPaymentDate("");
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

  function getBalanceLabel(balance: number) {
    if (balance > 0) {
      return "Owes";
    }

    if (balance < 0) {
      return "Credit";
    }

    return "Settled";
  }

  return (
    <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-400">Ledger</p>

          <div>
            <h2 className="text-xl font-semibold">
              {formatFullName(participant.firstName, participant.lastName)}
            </h2>

            {participant.nickname && (
              <p className="mt-1 text-sm text-zinc-500">
                {participant.nickname}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPaymentForm(true)}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black"
          >
            Add Payment
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">Total Charges</p>

          <p className="mt-1 text-xl font-semibold">{formatCurrency(ledger.totalCharges)}</p>
        </div>

        <div className="rounded-lg bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">Total Payments</p>

          <p className="mt-1 text-xl font-semibold">{formatCurrency(ledger.totalPayments)}</p>
        </div>

        <div className="rounded-lg bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">Balance</p>

          <p className="mt-1 text-xl font-semibold">{formatCurrency(ledger.balance)}</p>

          <p className="mt-1 text-xs text-zinc-500">
            {getBalanceLabel(ledger.balance)}
          </p>
        </div>
      </div>
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

                  <p className="text-xs text-zinc-500">{charge.chargeDate}</p>
                </div>

                <p className="font-semibold">{formatCurrency(charge.amount)}</p>
              </div>
            ))}
          </div>
        )}
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

                  <p className="text-xs text-zinc-500">{payment.paymentDate}</p>
                  {payment.reference && (
                    <p className="mt-1 text-xs text-zinc-600">
                      Ref: {payment.reference}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <p className="font-semibold">{formatCurrency(payment.amount)}</p>

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
    </div>
  );
}

export default ParticipantLedgerPanel;
