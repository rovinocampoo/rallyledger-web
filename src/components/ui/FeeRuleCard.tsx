import type { FeeRule } from "../../types/feeRule";
import { formatCurrency, formatLabel } from "../../utils/format";

type FeeRuleCardProps = {
  rule: FeeRule;
  onEdit: (rule: FeeRule) => void;
  onDelete: (rule: FeeRule) => void;
};

function FeeRuleCard({ rule, onEdit, onDelete }: FeeRuleCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-left">
          <p className="font-semibold">
            {rule.participantType
              ? formatLabel(rule.participantType)
              : "Any participant"}
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            {rule.matchType ? formatLabel(rule.matchType) : "Any match"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${
            rule.isActive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-zinc-800 text-zinc-500"
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
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(rule)}
          className="rounded-lg border border-red-900/60 px-3 py-2 text-sm text-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default FeeRuleCard;
