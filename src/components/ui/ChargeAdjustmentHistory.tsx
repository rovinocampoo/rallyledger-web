import { useEffect, useState } from "react";
import { getChargeAdjustments } from "../../api/charges";
import type { ChargeAdjustment } from "../../types/charge";
import { formatCurrency } from "../../utils/format";

type ChargeAdjustmentHistoryProps = {
  chargeId: number;
  initiallyOpen?: boolean;
};

function formatAdjustmentDate(value: string) {
  return new Date(value).toLocaleString();
}

function ChargeAdjustmentHistory({
  chargeId,
  initiallyOpen = false,
}: ChargeAdjustmentHistoryProps) {
  const [expanded, setExpanded] = useState(initiallyOpen);
  const [adjustments, setAdjustments] = useState<ChargeAdjustment[]>([]);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecking(true);

    getChargeAdjustments(chargeId)
      .then((data) => {
        if (ignore) {
          return;
        }

        setAdjustments(data);
        setError(null);
        setChecking(false);

        if (initiallyOpen && data.length > 0) {
          setExpanded(true);
        }
      })
      .catch((err) => {
        console.error(err);

        if (!ignore) {
          setError("Failed to load adjustment history");
          setChecking(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [chargeId, initiallyOpen]);

  if (checking) {
    return null;
  }

  if (error) {
    return <p className="mt-2 text-xs text-red-400">{error}</p>;
  }

  // No history means no button and no unnecessary empty panel.
  if (adjustments.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="text-xs text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white"
      >
        {expanded
          ? "Hide adjustment history"
          : `Adjustment history (${adjustments.length})`}
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
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
        </div>
      )}
    </div>
  );
}

export default ChargeAdjustmentHistory;
