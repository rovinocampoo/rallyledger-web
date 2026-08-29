import { useEffect, useMemo, useState } from "react";
import { deleteFeeRule, getFeeRules } from "../api/feeRules";
import type { FeeRule } from "../types/feeRule";
import FeeRuleForm from "../components/ui/FeeRuleForm";
import { formatLabel } from "../utils/format";
import FeeRuleCard from "../components/ui/FeeRuleCard";

const FEE_TYPES = [
  "BALL",
  "COURT",
  "LIGHT",
  "TRAINING",
  "BALL_RENTAL",
  "RACKET_RENTAL",
] as const;

function getFeeDescription(feeType: (typeof FEE_TYPES)[number]) {
  switch (feeType) {
    case "BALL":
      return "Flat ball fee divided among match participants.";

    case "COURT":
      return "Daily court fee for nonmembers.";

    case "LIGHT":
      return "Light fee based on participant and optional match type.";

    case "TRAINING":
      return "Training fee per checked-in participant.";

    case "BALL_RENTAL":
      return "Flat ball-rental fee for an outsider session.";

    case "RACKET_RENTAL":
      return "Racket-rental fee per participant.";

    default:
      return "";
  }
}

function FeeRulesPage() {
  const [rules, setRules] = useState<FeeRule[]>([]);
  const [editingRule, setEditingRule] = useState<FeeRule | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    getFeeRules()
      .then((data) => {
        if (!ignore) {
          setRules(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);

          setError(
            err instanceof Error ? err.message : "Failed to load fee rules",
          );

          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!editingRule || loading) {
      return;
    }

    const element = document.getElementById(`fee-${editingRule.id}`);

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [editingRule, loading]);

  const sortedRules = useMemo(() => {
    return [...rules].sort((a, b) => {
      const aKey = `${a.feeType}-${a.participantType ?? ""}-${a.matchType ?? ""}`;
      const bKey = `${b.feeType}-${b.participantType ?? ""}-${b.matchType ?? ""}`;

      return aKey.localeCompare(bKey);
    });
  }, [rules]);

  function handleAdd() {
    setEditingRule(null);
    setShowForm(true);
    setError(null);
  }

  function handleEdit(rule: FeeRule) {
    setEditingRule(rule);
    setShowForm(true);
    setError(null);
  }

  async function handleDelete(rule: FeeRule) {
    const confirmed = window.confirm(
      `Delete ${formatLabel(rule.feeType)} fee rule?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await deleteFeeRule(rule.id);

      setRules((current) => current.filter((item) => item.id !== rule.id));
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Failed to delete fee rule",
      );
    }
  }

  function handleSaved(savedRule: FeeRule) {
    setRules((current) => {
      const exists = current.some((rule) => rule.id === savedRule.id);

      if (exists) {
        return current.map((rule) =>
          rule.id === savedRule.id ? savedRule : rule,
        );
      }

      return [...current, savedRule];
    });

    setEditingRule(null);
    setShowForm(false);
    setError(null);
  }

  function handleCancel() {
    setEditingRule(null);
    setShowForm(false);
    setError(null);
  }

  if (loading) {
    return <p>Loading fee rules...</p>;
  }

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h1 className="text-2xl font-bold">Fee Rules</h1>

          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Configure ball, court, light, training, and rental pricing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="primary-action w-full rounded-lg px-4 py-3 text-sm font-medium sm:w-auto sm:py-2"
        >
          Add Fee Rule
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-left text-sm text-red-400">
          {error}
        </p>
      )}

      {showForm && editingRule === null && (
        <FeeRuleForm
          rule={null}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      )}

      <div className="space-y-8">
        {FEE_TYPES.map((feeType) => {
          const typeRules = sortedRules.filter(
            (rule) => rule.feeType === feeType,
          );

          return (
            <section key={feeType}>
              <div className="mb-3 text-left">
                <h2 className="text-lg font-semibold">
                  {formatLabel(feeType)} Fees
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {getFeeDescription(feeType)}
                </p>
              </div>
              {/* DESKTOP HEADER */}
              <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px_90px_150px] items-center gap-3 rounded-t-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 md:grid">
                <span>Participant Type</span>
                <span>Match Type</span>
                <span>Amount</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              {/* MOBILE CARDS + DESKTOP ROWS */}
              <div className="space-y-3 md:space-y-0 md:overflow-hidden md:rounded-b-xl md:border-x md:border-b md:border-zinc-200 dark:md:border-zinc-800">
                {typeRules.length === 0 ? (
                  <p className="bg-white px-4 py-6 text-left text-sm text-zinc-500 dark:bg-zinc-900">
                    No {formatLabel(feeType).toLowerCase()} fee rules.
                  </p>
                ) : (
                  typeRules.map((rule) => (
                    <div key={rule.id} id={`fee-${rule.id}`}>
                      <FeeRuleCard
                        rule={rule}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />

                      {showForm && editingRule?.id === rule.id && (
                        <div className="mt-3 md:mt-0 md:border-t md:border-zinc-200 md:bg-zinc-50 md:p-4 dark:md:border-zinc-800 dark:md:bg-zinc-950">
                          <FeeRuleForm
                            rule={editingRule}
                            onSaved={handleSaved}
                            onCancel={handleCancel}
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default FeeRulesPage;
