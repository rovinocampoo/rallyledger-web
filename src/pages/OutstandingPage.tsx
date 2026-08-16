import { useEffect, useState } from "react";
import { getOutstanding } from "../api/reports";
import { getParticipants } from "../api/participants";

import type { OutstandingParticipant } from "../types/report";
import type { Participant } from "../types/participant";

import ParticipantLedgerPanel from "../components/ui/ParticipantLedgerPanel";
import { formatCurrency, formatFullName } from "../utils/format";
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
  const limitParam = searchParams.get("limit");

  const limit =
    limitParam && Number(limitParam) > 0 ? Number(limitParam) : undefined;
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([getOutstanding(limit), getParticipants()])
      .then(([outstandingData, participantData]) => {
        if (!ignore) {
          setOutstanding(outstandingData);
          setParticipants(participantData);
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

      const headers = [
        "First Name",
        "Last Name",
        "Nickname",
        "Total Charges",
        "Total Payments",
        "Balance",
      ];

      const rows = exportData.map((participant) => [
        participant.firstName,
        participant.lastName,
        participant.nickname,
        participant.totalCharges,
        participant.totalPayments,
        participant.balance,
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map(escapeCsvValue).join(","))
        .join("\n");

      const csvWithBom = "\uFEFF" + csv;

      const blob = new Blob([csvWithBom], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      link.download = `outstanding-balances-${today}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setActionError("Failed to export outstanding balances");
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
        <div className="grid grid-cols-[1fr_auto] items-end gap-4">
          <div className="min-w-0 text-left">
            <h1 className="text-2xl font-bold">Outstanding Balances</h1>

            <p className="mt-1 text-sm text-zinc-400">
              Participants with unpaid balances.
            </p>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-sm text-zinc-500">Show</span>

              <select
                value={limit?.toString() ?? "ALL"}
                onChange={(event) => handleLimitChange(event.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
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
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>
      {actionError && (
        <p className="mb-4 text-sm text-red-400">{actionError}</p>
      )}

      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-400">
          {limit ? "Shown Outstanding" : "Total Outstanding"}
        </p>
        <p className="mt-2 text-3xl font-bold">
          {formatCurrency(totalOutstanding)}
        </p>
        {limit && (
          <p className="mt-1 text-xs text-zinc-500">
            Top {outstanding.length} participants shown.
          </p>
        )}
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
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-left hover:bg-zinc-800"
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

                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Balance</p>

                    <p className="font-semibold">
                      {formatCurrency(item.balance)}
                    </p>
                  </div>
                </button>

                {ledgerParticipantId === item.participantId && participant && (
                  <ParticipantLedgerPanel
                    participant={participant}
                    onClose={() => setLedgerParticipantId(null)}
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
