import { useEffect, useState } from "react";
import { getSessionCharges } from "../../api/charges";
import type { Charge } from "../../types/charge";
import type { Session } from "../../types/session";
import { getParticipants } from "../../api/participants";
import type { Participant } from "../../types/participant";
import {
  formatCurrency,
  formatFullName,
  formatLabel,
} from "../../utils/format";

type SessionChargesPanelProps = {
  session: Session;
  onClose: () => void;
  onParticipantSelected: (participantId: number) => void;
};

function SessionChargesPanel({
  session,
  onClose,
  onParticipantSelected,
}: SessionChargesPanelProps) {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const total = charges.reduce((sum, charge) => sum + charge.amount, 0);
  const matchIds = [
    ...new Set(
      charges
        .map((charge) => charge.matchId)
        .filter((matchId) => matchId !== null),
    ),
  ];
  const sessionLevelCharges = charges.filter(
    (charge) => charge.matchId === null,
  );

  useEffect(() => {
    let ignore = false;

    Promise.all([getSessionCharges(session.id), getParticipants()])
      .then(([chargeData, participantData]) => {
        if (!ignore) {
          setCharges(chargeData);
          setParticipants(participantData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError("Failed to load session charges");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [session.id]);

  const participantTotals = charges.reduce<Record<number, number>>(
    (totals, charge) => {
      totals[charge.participantId] =
        (totals[charge.participantId] ?? 0) + charge.amount;

      return totals;
    },
    {},
  );

  function getParticipant(participantId: number) {
    return participants.find((participant) => participant.id === participantId);
  }
  if (loading) {
    return <p>Loading session charges...</p>;
  }

  if (error) {
    return (
      <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>

        <button
          type="button"
          onClick={onClose}
          className="secondary-action mt-3 rounded-lg px-3 py-2 text-sm"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 text-left">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Session Charges
          </p>
          <h3 className="text-lg font-semibold">{session.name}</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Total: {formatCurrency(total)}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
        >
          Close
        </button>
      </div>

      {charges.length === 0 ? (
        <p className="mt-5 text-sm text-zinc-500">No session charges yet.</p>
      ) : (
        <>
          <div className="mt-6">
            <h4 className="font-semibold">Participant Totals</h4>

            <div className="mt-3 space-y-2">
              {Object.entries(participantTotals)
                .sort(([, amountA], [, amountB]) => amountB - amountA)
                .map(([participantId, amount]) => {
                  const participant = getParticipant(Number(participantId));

                  return (
                    <button
                      key={participantId}
                      type="button"
                      onClick={() =>
                        onParticipantSelected(Number(participantId))
                      }
                      className="flex w-full items-center justify-between rounded-lg bg-white dark:bg-zinc-900 px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <div>
                        <p className="font-medium">
                          {participant
                            ? formatFullName(
                                participant.firstName,
                                participant.lastName,
                              )
                            : `Participant #${participantId}`}
                        </p>

                        {participant?.nickname && (
                          <p className="text-xs text-zinc-500">
                            {participant.nickname}
                          </p>
                        )}
                      </div>

                      <span className="font-medium">
                        {formatCurrency(amount)}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
          {sessionLevelCharges.length > 0 && (
            <div className="mt-8">
              <h4 className="font-semibold">Session-Level Charges</h4>

              <div className="mt-3 rounded-lg bg-white dark:bg-zinc-900 p-4">
                <div className="space-y-2">
                  {sessionLevelCharges.map((charge) => {
                    const participant = getParticipant(charge.participantId);

                    return (
                      <div
                        key={charge.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {participant
                            ? formatFullName(
                                participant.firstName,
                                participant.lastName,
                              )
                            : `Participant #${charge.participantId}`}{" "}
                          — {formatLabel(charge.feeType)}
                        </span>

                        <span>{formatCurrency(charge.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {matchIds.length > 0 && (
            <div className="mt-8">
              <h4 className="font-semibold">Match Breakdown</h4>

              <div className="mt-3 space-y-4">
                {matchIds.map((matchId) => {
                  const matchCharges = charges.filter(
                    (charge) => charge.matchId === matchId,
                  );

                  const matchTotal = matchCharges.reduce(
                    (sum, charge) => sum + charge.amount,
                    0,
                  );

                  return (
                    <div
                      key={matchId}
                      className="rounded-lg bg-white dark:bg-zinc-900 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Match #{matchId}</p>
                        <p className="font-medium">
                          {formatCurrency(matchTotal)}
                        </p>{" "}
                      </div>

                      <div className="mt-3 space-y-2">
                        {matchCharges.map((charge) => {
                          const participant = getParticipant(
                            charge.participantId,
                          );

                          return (
                            <div
                              key={charge.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-zinc-600 dark:text-zinc-400">
                                {participant
                                  ? formatFullName(
                                      participant.firstName,
                                      participant.lastName,
                                    )
                                  : `Participant #${charge.participantId}`}{" "}
                                — {formatLabel(charge.feeType)}
                              </span>

                              <span>{formatCurrency(charge.amount)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SessionChargesPanel;
