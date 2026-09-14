import { useEffect, useState } from "react";
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

function formatMetadata(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata);

  if (entries.length === 0) {
    return null;
  }

  return entries
    .map(([key, value]) => {
      if (value === null || value === undefined) {
        return "";
      }

      if (typeof value === "object") {
        return `${key}: ${JSON.stringify(value)}`;
      }

      return `${key}: ${String(value)}`;
    })
    .filter(Boolean)
    .join(" · ");
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
            className="secondary-action rounded-lg px-4 py-2.5 text-sm font-medium"
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
              const metadata = formatMetadata(log.metadata);

              return (
                <article key={log.id} className="px-5 py-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
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

                      {metadata && (
                        <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                          {metadata}
                        </p>
                      )}
                    </div>

                    <time className="shrink-0 text-xs text-zinc-400 md:text-right">
                      {formatDateTime(log.createdAt)}
                    </time>
                  </div>
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
