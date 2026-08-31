import { useEffect, useState } from "react";
import { getOutstanding } from "../api/reports";
import { getParticipants } from "../api/participants";

import type { OutstandingParticipant } from "../types/report";
import type { Participant } from "../types/participant";

import ParticipantLedgerPanel from "../components/ui/ParticipantLedgerPanel";
import { formatCurrency, formatFullName, formatLabel } from "../utils/format";
import { escapeCsvValue } from "../utils/csv";

import { useSearchParams } from "react-router-dom";

function OutstandingPage() {
  const [outstanding, setOutstanding] = useState<OutstandingParticipant[]>([]);

  const [participants, setParticipants] = useState<Participant[]>([]);

  const [ledgerParticipantId, setLedgerParticipantId] = useState<number | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const allowedLimits = [5, 10, 20, 50, 100];

  const parsedLimit = Number(searchParams.get("limit"));

  const limit = allowedLimits.includes(parsedLimit) ? parsedLimit : undefined;
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([getOutstanding(limit), getParticipants()])
      .then(([outstandingData, participantData]) => {
        if (!ignore) {
          setOutstanding(outstandingData);
          setParticipants(participantData);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError("Failed to load outstanding balances");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [limit]);

  useEffect(() => {
    if (loading || ledgerParticipantId === null) {
      return;
    }

    requestAnimationFrame(() => {
      const element = document.getElementById(
        `participant-${ledgerParticipantId}`,
      );

      element?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [ledgerParticipantId, loading]);

  const totalOutstanding = outstanding.reduce(
    (sum, participant) => sum + participant.balance,
    0,
  );

  function handleLimitChange(value: string) {
    setLoading(true);
    setError(null);
    setLedgerParticipantId(null);

    if (value === "ALL") {
      setSearchParams({});
      return;
    }

    setSearchParams({
      limit: value,
    });
  }

  async function handleExportCsv() {
    try {
      setActionError(null);

      const exportData = await getOutstanding();

      const today = new Date();
      const reportDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-");

      const headers = [
        "Report Date",
        "Rank",
        "First Name",
        "Last Name",
        "Nickname",
        "Participant Type",
        "Membership Status",
        "Total Charges (PHP)",
        "Total Payments (PHP)",
        "Outstanding Balance (PHP)",
      ];

      const rows = exportData.map((item, index) => {
        const participant = participants.find(
          (participant) => participant.id === item.participantId,
        );

        return [
          reportDate,
          index + 1,
          item.firstName,
          item.lastName,
          item.nickname ?? "",
          participant ? formatLabel(participant.participantType) : "",
          participant ? formatLabel(participant.membershipStatus) : "",
          item.totalCharges,
          item.totalPayments,
          item.balance,
        ];
      });

      const csv = [headers, ...rows]
        .map((row) => row.map(escapeCsvValue).join(","))
        .join("\r\n");

      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `outstanding-balances-${reportDate}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setActionError("Failed to export outstanding balances");
    }
  }

  async function refreshOutstanding() {
    try {
      const data = await getOutstanding(limit);

      setOutstanding(data);
    } catch (err) {
      console.error(err);

      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to refresh outstanding balances",
      );
    }
  }

  if (loading) {
    return <p>Loading outstanding balances...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 text-left">
            <h1 className="text-2xl font-bold">Outstanding Balances</h1>

            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Participants with unpaid balances.
            </p>
          </div>
          <div className="grid w-full grid-cols-[1fr_auto] items-center gap-2 sm:flex sm:w-auto">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-sm text-zinc-500">Show</span>

              <select
                value={limit?.toString() ?? "ALL"}
                onChange={(event) => handleLimitChange(event.target.value)}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              >
                <option value="ALL">All</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={outstanding.length === 0}
              className="transition-colors rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>
      {actionError && (
        <p className="mb-4 text-sm text-red-400">{actionError}</p>
      )}

      <div className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {limit ? "Shown Outstanding" : "Total Outstanding"}
        </p>
        <p className="mt-2 text-3xl font-bold">
          {formatCurrency(totalOutstanding)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {limit
            ? `Top ${outstanding.length} ${
                outstanding.length === 1 ? "participant" : "participants"
              } shown.`
            : `${outstanding.length} ${
                outstanding.length === 1 ? "participant" : "participants"
              } shown.`}
        </p>
      </div>

      <div className="space-y-3">
        {outstanding.length === 0 ? (
          <p className="text-sm text-zinc-500">No outstanding balances.</p>
        ) : (
          outstanding.map((item) => {
            const participant = participants.find(
              (participant) => participant.id === item.participantId,
            );

            return (
              <div
                key={item.participantId}
                id={`participant-${item.participantId}`}
                className="space-y-3"
              >
                <button
                  type="button"
                  onClick={() =>
                    setLedgerParticipantId((current) =>
                      current === item.participantId
                        ? null
                        : item.participantId,
                    )
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <div>
                    <p className="font-medium">
                      {formatFullName(item.firstName, item.lastName)}
                    </p>

                    {item.nickname && (
                      <p className="text-xs text-zinc-500">{item.nickname}</p>
                    )}

                    <p className="mt-2 text-xs text-zinc-500">
                      Charges: {formatCurrency(item.totalCharges)}
                      {" · "}
                      Payments: {formatCurrency(item.totalPayments)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-zinc-500">Balance</p>
                    <p className="truncate font-medium">
                      {formatCurrency(item.balance)}
                    </p>
                  </div>
                </button>

                {ledgerParticipantId === item.participantId && participant && (
                  <ParticipantLedgerPanel
                    participant={participant}
                    onClose={() => setLedgerParticipantId(null)}
                    onLedgerChanged={refreshOutstanding}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default OutstandingPage;
