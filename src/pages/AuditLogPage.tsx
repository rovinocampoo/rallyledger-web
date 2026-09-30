import { useEffect, useState, type ReactNode } from "react";
import { formatCurrency, formatDate, formatLabel } from "../utils/format";
import { getAuditLogs, type AuditLog } from "../api/audit";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAction(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatMetadataKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

function formatMetadataValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (key === "amount" || key === "previousAmount" || key === "newAmount") {
    return formatCurrency(Number(value));
  }

  if (key.toLowerCase().includes("date")) {
    return formatDate(String(value));
  }

  if (key.toLowerCase().includes("paymentmethod")) {
    return formatLabel(String(value));
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function renderPaymentCorrectionMetadata(metadata: Record<string, unknown>) {
  const previousAmount = metadata.previousAmount;
  const newAmount = metadata.newAmount;

  const previousPaymentMethod = metadata.previousPaymentMethod;
  const newPaymentMethod = metadata.newPaymentMethod;

  const previousPaymentDate = metadata.previousPaymentDate;
  const newPaymentDate = metadata.newPaymentDate;

  const previousReference = metadata.previousReference;
  const newReference = metadata.newReference;

  const participantId = metadata.participantId;
  const reason = metadata.reason;

  const amountChanged = previousAmount !== newAmount;
  const paymentMethodChanged = previousPaymentMethod !== newPaymentMethod;
  const paymentDateChanged = previousPaymentDate !== newPaymentDate;
  const referenceChanged = previousReference !== newReference;

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-">
      {participantId !== null && participantId !== undefined && (
        <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Participant
          </p>

          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
            #{String(participantId)}
          </p>
        </div>
      )}

      {(previousAmount !== undefined || newAmount !== undefined) && (
        <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Amount
          </p>

          {amountChanged ? (
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="text-zinc-400 line-through">
                {formatCurrency(Number(previousAmount))}
              </span>

              <span className="text-zinc-400">→</span>

              <span className="font-semibold text-zinc-900 dark:text-white">
                {formatCurrency(Number(newAmount))}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
              {formatCurrency(Number(newAmount))}
            </p>
          )}
        </div>
      )}

      {(previousPaymentMethod !== undefined ||
        newPaymentMethod !== undefined) && (
        <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Payment Method
          </p>

          {paymentMethodChanged ? (
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="text-zinc-500">
                {formatLabel(String(previousPaymentMethod))}
              </span>

              <span className="text-zinc-400">→</span>

              <span className="font-semibold text-zinc-900 dark:text-white">
                {formatLabel(String(newPaymentMethod))}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
              {formatLabel(String(newPaymentMethod))}
            </p>
          )}
        </div>
      )}

      {(previousPaymentDate !== undefined || newPaymentDate !== undefined) && (
        <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Payment Date
          </p>

          {paymentDateChanged ? (
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="text-zinc-500">
                {formatDate(String(previousPaymentDate))}
              </span>

              <span className="text-zinc-400">→</span>

              <span className="font-semibold text-zinc-900 dark:text-white">
                {formatDate(String(newPaymentDate))}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
              {formatDate(String(newPaymentDate))}
            </p>
          )}
        </div>
      )}

      {(previousReference !== undefined || newReference !== undefined) && (
        <div className="rounded-lg bg-zinc-50 px-4 py-3 md:col-span-1 dark:bg-zinc-950">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Reference
          </p>

          {referenceChanged ? (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="break-all text-zinc-500">
                {previousReference ? String(previousReference) : "None"}
              </span>

              <span className="text-zinc-400">→</span>

              <span className="break-all font-semibold text-zinc-900 dark:text-white">
                {newReference ? String(newReference) : "None"}
              </span>
            </div>
          ) : (
            <p className="mt-1 break-all text-sm font-semibold text-zinc-900 dark:text-white">
              {newReference ? String(newReference) : "None"}
            </p>
          )}
        </div>
      )}

      {reason !== null && reason !== undefined && (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 md:col-span-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Reason
          </p>

          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            {String(reason)}
          </p>
        </div>
      )}
    </div>
  );
}

function renderMetadata(log: AuditLog): ReactNode {
  if (!log.metadata || Object.keys(log.metadata).length === 0) {
    return null;
  }

  if (log.action === "PAYMENT_CORRECTED") {
    return renderPaymentCorrectionMetadata(log.metadata);
  }

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {Object.entries(log.metadata).map(([key, value]) => {
        if (value === null || value === undefined) {
          return null;
        }

        return (
          <div
            key={key}
            className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-950"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              {formatMetadataKey(key)}
            </p>

            <p className="mt-1 break-words text-sm text-zinc-700 dark:text-zinc-300">
              {formatMetadataValue(key, value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLogs() {
    try {
      setLoading(true);
      setError(null);

      const data = await getAuditLogs();
      setLogs(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load audit log.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await getAuditLogs();

        if (!ignore) {
          setLogs(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Failed to load audit log.",
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">Administration</p>

        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Audit Log</h1>

            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Recent administrative and financial activity in this organization.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadLogs()}
            disabled={loading}
            className="primary-action rounded-lg px-4 py-2.5 text-sm font-medium"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {loading && logs.length === 0 ? (
          <p className="p-5 text-sm text-zinc-500">Loading audit log...</p>
        ) : logs.length === 0 ? (
          <p className="p-5 text-sm text-zinc-500">No audit events yet.</p>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {logs.map((log) => {
              return (
                <article key={log.id} className="px-6 py-5">
                  {/* EVENT HEADER */}
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                          {formatAction(log.action)}
                        </span>

                        <span className="text-xs text-zinc-400">
                          {log.entityType}
                          {log.entityId !== null ? ` #${log.entityId}` : ""}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                        {log.actorEmail ?? "System"}
                      </p>
                    </div>

                    <time className="shrink-0 pt-1 text-xs text-zinc-400">
                      {formatDateTime(log.createdAt)}
                    </time>
                  </div>

                  {/* EVENT DETAILS */}
                  {renderMetadata(log)}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default AuditLogPage;
