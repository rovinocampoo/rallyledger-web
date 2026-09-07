import { useState, type SubmitEvent } from "react";
import { createFeeRule, updateFeeRule } from "../../api/feeRules";
import type { FeeRule, FeeRuleInput } from "../../types/feeRule";
import { formatLabel } from "../../utils/format";
import type { ParticipantCategory } from "../../types/participantCategory";

type FeeRuleFormProps = {
  rule?: FeeRule | null;
  categories: ParticipantCategory[];
  onSaved: (savedRule: FeeRule) => void;
  onCancel: () => void;
};

const MATCH_TYPES = ["SINGLES", "DOUBLES", "MIXED_DOUBLES"];

function feeUsesParticipantType(feeType: FeeRuleInput["feeType"]) {
  return (
    feeType === "COURT" ||
    feeType === "LIGHT" ||
    feeType === "TRAINING" ||
    feeType === "BALL_RENTAL" ||
    feeType === "RACKET_RENTAL"
  );
}

function feeUsesMatchType(feeType: FeeRuleInput["feeType"]) {
  return feeType === "BALL" || feeType === "LIGHT";
}

function FeeRuleForm({
  rule,
  categories,
  onSaved,
  onCancel,
}: FeeRuleFormProps) {
  const [feeType, setFeeType] = useState<FeeRuleInput["feeType"]>(
    rule?.feeType ?? "BALL",
  );
  const [participantType, setParticipantType] = useState(
    rule?.participantType ?? "",
  );
  const usesParticipantType = feeUsesParticipantType(feeType);

  const usesMatchType = feeUsesMatchType(feeType);
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
      participantType: usesParticipantType ? participantType || null : null,
      matchType: usesMatchType ? matchType || null : null,
      amount: parsedAmount,
      isActive,
    };

    try {
      setSubmitting(true);
      setFormError(null);

      let savedRule: FeeRule;

      if (rule) {
        savedRule = await updateFeeRule(rule.id, input);
      } else {
        savedRule = await createFeeRule(input);
      }

      onSaved(savedRule);
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
      className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6"
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
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Fee Type
          </span>

          <select
            value={feeType}
            onChange={(event) => {
              const value = event.target.value as FeeRuleInput["feeType"];

              setFeeType(value);

              if (!feeUsesParticipantType(value)) {
                setParticipantType("");
              }

              if (!feeUsesMatchType(value)) {
                setMatchType("");
              }
            }}
            className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2"
          >
            <option value="BALL">Ball</option>
            <option value="COURT">Court</option>
            <option value="LIGHT">Light</option>
            <option value="TRAINING">Training</option>
            <option value="BALL_RENTAL">Ball Rental</option>
            <option value="RACKET_RENTAL">Racket Rental</option>
          </select>
        </label>

        <label className="block min-w-0 text-left">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Participant Category
          </span>

          <select
            value={participantType}
            onChange={(event) => setParticipantType(event.target.value)}
            disabled={!usesParticipantType}
            className="mt-2 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Any participant / Default</option>

            {categories
              .filter(
                (category) =>
                  category.isActive || category.code === participantType,
              )
              .map((category) => (
                <option key={category.id} value={category.code}>
                  {category.name}
                </option>
              ))}
          </select>
        </label>

        <label className="block min-w-0 text-left">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Match Type
          </span>

          <select
            value={matchType}
            onChange={(event) => setMatchType(event.target.value)}
            disabled={!usesMatchType}
            className="mt-2 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Any match / Default</option>

            {MATCH_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0 text-left">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Amount (PHP)
          </span>

          <input
            type="number"
            min="0"
            step="1"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2"
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
          className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving..." : rule ? "Update Rule" : "Create Rule"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="transition-colors rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default FeeRuleForm;
