import type { FeeRule } from "../../types/feeRule";
import { formatCurrency, formatLabel } from "../../utils/format";
import type { ParticipantCategory } from "../../types/participantCategory";
import { getParticipantCategoryLabel } from "../../utils/participantCategory";

type FeeRuleCardProps = {
  rule: FeeRule;
  categories: ParticipantCategory[];
  onEdit: (rule: FeeRule) => void;
  onDelete: (rule: FeeRule) => void;
};

function FeeRuleCard({
  rule,
  categories,
  onEdit,
  onDelete,
}: FeeRuleCardProps) {
  return (
    <>
      {/* MOBILE CARD */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 text-left">
            <p className="font-semibold">
              {getParticipantCategoryLabel(categories, rule.participantType)}
            </p>

            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {rule.matchType ? formatLabel(rule.matchType) : "Any match"}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${
              rule.isActive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
            }`}
          >
            {rule.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <p className="mt-4 text-left text-2xl font-bold">
          {formatCurrency(rule.amount)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onEdit(rule)}
            className="transition-colors rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(rule)}
            className="danger-action rounded-lg border border-red-900/60 px-4 py-2 text-sm text-red-400"
          >
            Delete
          </button>
        </div>
      </div>

      {/* DESKTOP ROW */}
      <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px_90px_150px] items-center gap-3 border-t border-zinc-200 bg-white px-4 py-3 text-left dark:border-zinc-800 dark:bg-zinc-900 hidden md:grid">
        <p className="min-w-0 truncate text-sm text-zinc-600 dark:text-zinc-400">
          {rule.participantType
            ? getParticipantCategoryLabel(categories, rule.participantType)
            : "Any"}
        </p>

        <p className="min-w-0 truncate text-sm text-zinc-600 dark:text-zinc-400">
          {rule.matchType ? formatLabel(rule.matchType) : "Any"}
        </p>

        <p className="font-semibold">{formatCurrency(rule.amount)}</p>

        <span
          className={`w-fit rounded-full px-2.5 py-1 text-xs ${
            rule.isActive
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
          }`}
        >
          {rule.isActive ? "Active" : "Inactive"}
        </span>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(rule)}
            className="secondary-action rounded-lg px-3 py-1.5 text-sm"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(rule)}
            className="danger-action rounded-lg px-3 py-1.5 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </>
  );
}

export default FeeRuleCard;
