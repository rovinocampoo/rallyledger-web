import { useState, type SubmitEvent } from "react";
import { updateCharge } from "../../api/charges";
import type { Charge } from "../../types/charge";
import { formatCurrency } from "../../utils/format";

type ChargeEditFormProps = {
  charge: Charge;
  onSaved: (updatedCharge: Charge) => void;
  onCancel: () => void;
};

function ChargeEditForm({ charge, onSaved, onCancel }: ChargeEditFormProps) {
  const [amount, setAmount] = useState(String(charge.amount));
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount = Number(amount);

    if (
      amount.trim() === "" ||
      !Number.isInteger(parsedAmount) ||
      parsedAmount < 0
    ) {
      setError("Amount must be a whole peso amount of 0 or greater.");
      return;
    }

    if (parsedAmount === charge.amount) {
      setError("Enter an amount different from the current amount.");
      return;
    }

    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const updatedCharge = await updateCharge(charge.id, {
        amount: parsedAmount,
        reason,
      });

      onSaved(updatedCharge);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Failed to update charge");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left dark:border-zinc-700 dark:bg-zinc-950"
    >
      <p className="text-xs text-zinc-500">
        Current amount: {formatCurrency(charge.amount)}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            New Amount (PHP)
          </span>

          <input
            type="number"
            min="0"
            step="1"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Reason
          </span>

          <input
            type="text"
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Example: Special club discount"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="primary-action rounded-lg px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save Change"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="secondary-action rounded-lg px-3 py-2 text-sm disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default ChargeEditForm;
