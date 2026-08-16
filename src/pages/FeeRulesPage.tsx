import { useEffect, useMemo, useState } from "react";
import { deleteFeeRule, getFeeRules } from "../api/feeRules";
import type { FeeRule } from "../types/feeRule";
import FeeRuleForm from "../components/ui/FeeRuleForm";
import { formatCurrency, formatLabel } from "../utils/format";

const FEE_TYPES = ["BALL", "COURT", "LIGHT"] as const;

function getFeeDescription(feeType: (typeof FEE_TYPES)[number]) {
  if (feeType === "BALL") {
    return "Per-match ball fee rules.";
  }

  if (feeType === "COURT") {
    return "Daily court fee rules.";
  }

  return "Per-match light fee rules.";
}

function FeeRulesPage() {
  const [rules, setRules] = useState<FeeRule[]>([]);
  const [editingRule, setEditingRule] = useState<FeeRule | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRules() {
    const data = await getFeeRules();
    setRules(data);
  }

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
      await loadRules();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Failed to delete fee rule",
      );
    }
  }

  async function handleSaved() {
    await loadRules();
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

          <p className="mt-1 text-sm text-zinc-400">
            Configure the club&apos;s default ball, court, and light pricing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black sm:w-auto sm:py-2"
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

              {/* MOBILE */}
              <div className="space-y-3 md:hidden">
                {typeRules.length === 0 ? (
                  <p className="text-left text-sm text-zinc-500">
                    No {formatLabel(feeType).toLowerCase()} fee rules.
                  </p>
                ) : (
                  typeRules.map((rule) => (
                    <div key={rule.id}  id={`fee-${rule.id}`} className="space-y-3">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 text-left">
                            <p className="font-semibold">
                              {rule.participantType
                                ? formatLabel(rule.participantType)
                                : "Any participant"}
                            </p>

                            <p className="mt-1 text-sm text-zinc-400">
                              {rule.matchType
                                ? formatLabel(rule.matchType)
                                : "Any match"}
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
                            onClick={() => handleEdit(rule)}
                            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(rule)}
                            className="rounded-lg border border-red-900/60 px-3 py-2 text-sm text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {showForm && editingRule?.id === rule.id && (
                        <FeeRuleForm
                          rule={editingRule}
                          onSaved={handleSaved}
                          onCancel={handleCancel}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* DESKTOP */}
              <div className="hidden overflow-hidden rounded-xl border border-zinc-800 md:block">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px_90px_150px] items-center gap-3 bg-zinc-950 px-4 py-3 text-left text-sm text-zinc-500">
                  <span>Participant Type</span>
                  <span>Match Type</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>

                {typeRules.length === 0 ? (
                  <p className="bg-zinc-900 px-4 py-6 text-left text-sm text-zinc-500">
                    No {formatLabel(feeType).toLowerCase()} fee rules.
                  </p>
                ) : (
                  typeRules.map((rule) => (
                    <div key={rule.id}>
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px_90px_150px] items-center gap-3 border-t border-zinc-800 bg-zinc-900 px-4 py-3 text-left">
                        <p className="min-w-0 truncate text-sm text-zinc-400">
                          {rule.participantType
                            ? formatLabel(rule.participantType)
                            : "Any"}
                        </p>

                        <p className="min-w-0 truncate text-sm text-zinc-400">
                          {rule.matchType ? formatLabel(rule.matchType) : "Any"}
                        </p>

                        <p className="font-semibold">
                          {formatCurrency(rule.amount)}
                        </p>

                        <span
                          className={`w-fit rounded-full px-2.5 py-1 text-xs ${
                            rule.isActive
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </span>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(rule)}
                            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(rule)}
                            className="rounded-lg border border-red-900/60 px-3 py-1.5 text-sm text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {showForm && editingRule?.id === rule.id && (
                        <div className="border-t border-zinc-800 bg-zinc-950 p-4">
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
