import type { Match } from "../../types/match";
import { formatLabel } from "../../utils/format";

type SessionChargeReviewParticipant = {
  participantId: number;
  teamSide: string;
  firstName: string;
  lastName: string;
};

export type SessionChargeReviewMatch = {
  matchNumber: number;
  match: Match;
  participants: SessionChargeReviewParticipant[];
};

type SessionChargeReviewModalProps = {
  sessionName: string;
  matches: SessionChargeReviewMatch[];
  generating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function SessionChargeReviewModal({
  sessionName,
  matches,
  generating,
  onCancel,
  onConfirm,
}: SessionChargeReviewModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
              Review Match Participants
            </h2>

            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {sessionName}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={generating}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            Please verify that the players and match results are correct.
            Charges will be generated after confirmation.
          </div>

          <div className="space-y-3">
            {matches.map(({ matchNumber, match, participants }) => {
              const teamA = participants.filter(
                (participant) => participant.teamSide === "A",
              );

              const teamB = participants.filter(
                (participant) => participant.teamSide === "B",
              );

              return (
                <div
                  key={match.id}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-zinc-950 dark:text-white">
                      Match #{matchNumber}
                    </h3>

                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                      {formatLabel(match.result)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Team A
                      </p>

                      <div className="mt-2 space-y-1">
                        {teamA.length > 0 ? (
                          teamA.map((participant) => (
                            <p
                              key={`${match.id}-A-${participant.participantId}`}
                              className="text-sm text-zinc-900 dark:text-zinc-100"
                            >
                              {participant.firstName} {participant.lastName}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-zinc-400">No players</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Team B
                      </p>

                      <div className="mt-2 space-y-1">
                        {teamB.length > 0 ? (
                          teamB.map((participant) => (
                            <p
                              key={`${match.id}-B-${participant.participantId}`}
                              className="text-sm text-zinc-900 dark:text-zinc-100"
                            >
                              {participant.firstName} {participant.lastName}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-zinc-400">No players</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 p-5 sm:flex-row sm:justify-end dark:border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={generating}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={generating}
            className="primary-action w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {generating ? "Generating Charges..." : "Generate Charges"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionChargeReviewModal;
