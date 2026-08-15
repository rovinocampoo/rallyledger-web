import { useEffect, useState } from "react";
import { getOutstanding } from "../api/reports";
import { getParticipants } from "../api/participants";

import type { OutstandingParticipant } from "../types/report";
import type { Participant } from "../types/participant";

import ParticipantLedgerPanel from "../components/ui/ParticipantLedgerPanel";
import { formatCurrency, formatFullName } from "../utils/format";

function OutstandingPage() {
  const [outstanding, setOutstanding] = useState<OutstandingParticipant[]>([]);

  const [participants, setParticipants] = useState<Participant[]>([]);

  const [ledgerParticipantId, setLedgerParticipantId] = useState<number | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ledgerParticipant =
    participants.find(
      (participant) => participant.id === ledgerParticipantId,
    ) ?? null;

  useEffect(() => {
    let ignore = false;

    Promise.all([getOutstanding(), getParticipants()])
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
  }, []);

  const totalOutstanding = outstanding.reduce(
    (sum, participant) => sum + participant.balance,
    0,
  );

  if (loading) {
    return <p>Loading outstanding balances...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Outstanding Balances</h1>

        <p className="mt-1 text-sm text-zinc-400">
          Participants with unpaid balances.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-400">Total Outstanding</p>

        <p className="mt-2 text-3xl font-bold">
          {formatCurrency(totalOutstanding)}
        </p>
      </div>

      {ledgerParticipant && (
        <ParticipantLedgerPanel
          key={ledgerParticipant.id}
          participant={ledgerParticipant}
          onClose={() => setLedgerParticipantId(null)}
        />
      )}

      <div className="space-y-3">
        {outstanding.length === 0 ? (
          <p className="text-sm text-zinc-500">No outstanding balances.</p>
        ) : (
          outstanding.map((item) => (
            <button
              key={item.participantId}
              type="button"
              onClick={() => setLedgerParticipantId(item.participantId)}
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

                <p className="font-semibold">{formatCurrency(item.balance)}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default OutstandingPage;
