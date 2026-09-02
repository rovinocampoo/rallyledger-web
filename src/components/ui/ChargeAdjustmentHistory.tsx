import { useState } from "react";
import { getChargeAdjustments } from "../../api/charges";
import type { ChargeAdjustment } from "../../types/charge";
import { formatCurrency } from "../../utils/format";

type ChargeAdjustmentHistoryProps = {
  chargeId: number;
};

function formatAdjustmentDate(value: string) {
  return new Date(value).toLocaleString();
}

function ChargeAdjustmentHistory({ chargeId }: ChargeAdjustmentHistoryProps) {
  const [adjustments, setAdjustments] = useState<ChargeAdjustment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);

    if (loaded) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getChargeAdjustments(chargeId);

      setAdjustments(data);
      setLoaded(true);
    } catch (err) {
      console.error(err);
      setError("Failed to load adjustment history");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleToggle}
        className="text-xs text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white"
      >
        {expanded ? "Hide adjustment history" : "Adjustment history"}
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
          {loading ? (
            <p className="text-xs text-zinc-500">Loading history...</p>
          ) : error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : adjustments.length === 0 ? (
            <p className="text-xs text-zinc-500">No adjustments recorded.</p>
          ) : (
            <div className="space-y-3">
              {adjustments.map((adjustment) => (
                <div
                  key={adjustment.id}
                  className="border-b border-zinc-200 pb-3 text-xs last:border-b-0 last:pb-0 dark:border-zinc-800"
                >
                  <p className="font-medium">
                    {formatCurrency(adjustment.previousAmount)}
                    {" → "}
                    {formatCurrency(adjustment.newAmount)}
                  </p>

                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    {adjustment.reason}
                  </p>

                  <p className="mt-1 text-zinc-500">
                    {formatAdjustmentDate(adjustment.createdAt)}
                    {" · "}
                    Admin #{adjustment.adjustedByAdminUserId}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChargeAdjustmentHistory;
