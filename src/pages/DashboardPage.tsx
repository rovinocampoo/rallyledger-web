import { useEffect, useState } from "react";
import { getReportSummary, getTopOutstanding } from "../api/reports";
import type { OutstandingParticipant, ReportSummary } from "../types/report";
import { formatCurrency, formatFullName } from "../utils/format";
import { useNavigate } from "react-router-dom";

function DashboardPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outstandingParticipants, setOutstandingParticipants] = useState<
    OutstandingParticipant[]
  >([]);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    Promise.all([getReportSummary(), getTopOutstanding()])
      .then(([summaryData, outstandingData]) => {
        if (!ignore) {
          setSummary(summaryData);
          setOutstandingParticipants(outstandingData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError("Failed to load dashboard");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!summary) {
    return <p>No dashboard data available.</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <p className="mt-1 text-sm text-zinc-400">RallyLedger overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Participants</p>

          <p className="mt-2 text-3xl font-bold">{summary.participantCount}</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Sessions</p>

          <p className="mt-2 text-3xl font-bold">{summary.sessionCount}</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Matches</p>

          <p className="mt-2 text-3xl font-bold">{summary.matchCount}</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Total Charges</p>

          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(summary.totalCharges)}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Total Payments</p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(summary.totalPayments)}
          </p>{" "}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Outstanding Balance</p>

          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(summary.outstandingBalance)}
          </p>
        </div>
      </div>
      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Top Outstanding</h2>

          <p className="mt-1 text-sm text-zinc-400">
            Participants with the highest unpaid balances.
          </p>
        </div>

        {outstandingParticipants.length === 0 ? (
          <p className="text-sm text-zinc-500">No outstanding balances.</p>
        ) : (
          <div className="space-y-2">
            {outstandingParticipants.map((participant) => (
              <button
                key={participant.participantId}
                type="button"
                onClick={() =>
                  navigate("/participants", {
                    state: {
                      ledgerParticipantId: participant.participantId,
                    },
                  })
                }
                className="flex w-full items-center justify-between rounded-lg bg-zinc-950 px-4 py-3 text-left hover:bg-zinc-800"
              >
                <div>
                  <p className="font-medium">
                    {formatFullName(
                      participant.firstName,
                      participant.lastName,
                    )}
                  </p>

                  {participant.nickname && (
                    <p className="text-xs text-zinc-500">
                      {participant.nickname}
                    </p>
                  )}
                </div>

                <p className="font-semibold">
                  {formatCurrency(participant.balance)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
