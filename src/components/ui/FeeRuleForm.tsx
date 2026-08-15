import { useState, type SubmitEvent } from "react";
import { createFeeRule, updateFeeRule } from "../../api/feeRules";
import type { FeeRule, FeeRuleInput } from "../../types/feeRule";
import { formatLabel } from "../../utils/format";

type FeeRuleFormProps = {
  rule?: FeeRule | null;
  onSaved: () => void;
  onCancel: () => void;
};

const PARTICIPANT_TYPES = [
  "MEMBER",
  "NONMEMBER",
  "MMSU_STUDENT",
  "MMSU_EMPLOYEE",
  "MMSU_VARSITY",
];

const MATCH_TYPES = ["SINGLES", "DOUBLES", "MIXED_DOUBLES"];

function FeeRuleForm({ rule, onSaved, onCancel }: FeeRuleFormProps) {
  const [feeType, setFeeType] = useState<FeeRuleInput["feeType"]>(
    rule?.feeType ?? "BALL",
  );
  const [participantType, setParticipantType] = useState(
    rule?.participantType ?? "",
  );
  const [matchType, setMatchType] = useState(rule?.matchType ?? "");
  const [amount, setAmount] = useState(rule ? String(rule.amount) : "");
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount = Number(amount);

    if (!Number.isInteger(parsedAmount) || parsedAmount < 0) {
      setFormError("Amount must be a whole peso amount of 0 or greater.");
      return;
    }

    const input: FeeRuleInput = {
      feeType,
      participantType: participantType || null,
      matchType: matchType || null,
      amount: parsedAmount,
      isActive,
    };

    try {
      setSubmitting(true);
      setFormError(null);

      if (rule) {
        await updateFeeRule(rule.id, input);
      } else {
        await createFeeRule(input);
      }

      onSaved();
    } catch (err) {
      console.error(err);

      setFormError(
        err instanceof Error ? err.message : "Failed to save fee rule",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6"
    >
      <div className="text-left">
        <h2 className="text-lg font-semibold">
          {rule ? "Edit Fee Rule" : "Add Fee Rule"}
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Configure the conditions and amount for this rule.
        </p>
      </div>

      {formError && (
        <p className="mt-4 text-left text-sm text-red-400">{formError}</p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="block min-w-0 text-left">
          <span className="text-sm text-zinc-400">Fee Type</span>

          <select
            value={feeType}
            onChange={(event) =>
              setFeeType(event.target.value as FeeRuleInput["feeType"])
            }
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          >
            <option value="BALL">Ball</option>
            <option value="COURT">Court</option>
            <option value="LIGHT">Light</option>
          </select>
        </label>

        <label className="block min-w-0 text-left">
          <span className="text-sm text-zinc-400">Participant Type</span>

          <select
            value={participantType}
            onChange={(event) => setParticipantType(event.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          >
            <option value="">Any / not applicable</option>

            {PARTICIPANT_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0 text-left">
          <span className="text-sm text-zinc-400">Match Type</span>

          <select
            value={matchType}
            onChange={(event) => setMatchType(event.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          >
            <option value="">Any / not applicable</option>

            {MATCH_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0 text-left">
          <span className="text-sm text-zinc-400">Amount (PHP)</span>

          <input
            type="number"
            min="0"
            step="1"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-left">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />

        <span className="text-sm">Active</span>
      </label>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving..." : rule ? "Update Rule" : "Create Rule"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default FeeRuleForm;
