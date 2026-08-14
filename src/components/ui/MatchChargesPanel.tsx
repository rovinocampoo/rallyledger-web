import { useEffect, useState } from "react";
import { getMatchCharges } from "../../api/charges";
import { getParticipants } from "../../api/participants";

import type { Charge } from "../../types/charge";
import type { Match } from "../../types/match";
import type { Participant } from "../../types/participant";

import {
  formatCurrency,
  formatFullName,
  formatLabel,
} from "../../utils/format";

type MatchChargesPanelProps = {
  match: Match;
  onClose: () => void;
};

function MatchChargesPanel({ match, onClose }: MatchChargesPanelProps) {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    let ignore = false;

    Promise.all([
      getMatchCharges(match.id),
      getParticipants(),
    ])
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
          setError("Failed to load match charges");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [match.id]);

  const total = charges.reduce((sum, charge) => sum + charge.amount, 0);

  if (loading) {
    return <p>Loading charges...</p>;
  }

  return (
    <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-400">Match Charges</p>
          <h3 className="text-lg font-semibold">Match #{match.id}</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Total: {formatCurrency(total)}
          </p>{" "}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-sm text-zinc-400 hover:text-white"
        >
          Close
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-5 space-y-2">
        {charges.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No match charges generated yet.
          </p>
        ) : (
          charges.map((charge) => {
            const participant = participants.find(
              (participant) => participant.id === charge.participantId,
            );

            return (
              <div
                key={charge.id}
                className="flex items-center justify-between rounded-lg bg-zinc-900 px-3 py-2"
              >
                <div>
                  <p className="font-medium">
                    {participant
                      ? formatFullName(
                          participant.firstName,
                          participant.lastName,
                        )
                      : `Participant #${charge.participantId}`}
                  </p>

                  {participant?.nickname && (
                    <p className="text-xs text-zinc-500">
                      {participant.nickname}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-zinc-400">
                    {formatLabel(charge.feeType)}
                  </p>
                </div>

                <span className="font-medium">
                  {formatCurrency(charge.amount)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MatchChargesPanel;
