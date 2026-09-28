import type { Session } from "../../types/session";
import { formatDate, formatLabel } from "../../utils/format";

type SessionCardProps = {
  session: Session;
  canDelete: boolean;
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
  onManagePlayers: (session: Session) => void;
  onManageMatches: (session: Session) => void;
  onViewCharges: () => void;
  onManageTraining: (session: Session) => void;
  onManageOutsider: (session: Session) => void;
  onViewResults: (session: Session) => void;
  onGenerateCharges: (session: Session) => void;
  generatingCharges: boolean;
  hasUnchargedMatches: boolean;
};

function SessionCard({
  session,
  canDelete,
  onEdit,
  onDelete,
  onManagePlayers,
  onManageMatches,
  onManageTraining,
  onManageOutsider,
  onViewResults,
  onViewCharges,
  onGenerateCharges,
  generatingCharges,
  hasUnchargedMatches,
}: SessionCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="min-w-0 text-left">
        <h2 className="truncate text-xl font-semibold">{session.name}</h2>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {formatDate(session.sessionDate)}
        </p>

        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
          {session.startTime} - {session.endTime}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
          {formatLabel(session.sessionType)}
        </span>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
          {session.maxPlayers === null
            ? "Unlimited players"
            : `Max ${session.maxPlayers} players`}
        </span>
        {session.freeBalls && (
          <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1">
            Free Balls
          </span>
        )}

        {session.freeLights && (
          <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1">
            Free Lights
          </span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
        <button
          type="button"
          onClick={() => onEdit(session)}
          className="transition-colors w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm sm:w-auto hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Edit
        </button>

        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(session)}
            className="danger-action w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 dark:border-red-900/60 dark:text-red-400 sm:w-auto"
          >
            Delete
          </button>
        )}
        {session.sessionType === "REGULAR_PLAY" && (
          <>
            <button
              type="button"
              onClick={() => onManageMatches(session)}
              className="transition-colors w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm sm:w-auto hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Manage Matches
            </button>

            <button
              type="button"
              onClick={() => onViewResults(session)}
              className="transition-colors w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm sm:w-auto hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              View Results
            </button>
            {hasUnchargedMatches && (
              <button
                type="button"
                onClick={() => onGenerateCharges(session)}
                disabled={generatingCharges}
                className="primary-action w-full col-span-2 rounded-lg px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {generatingCharges ? "Checking Matches..." : "Generate Charges"}
              </button>
            )}
          </>
        )}

        {session.sessionType === "TRAINING" && (
          <button
            type="button"
            onClick={() => onManageTraining(session)}
            className="transition-colors w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm sm:w-auto hover:bg-zinc-100 dark:hover:bg-zinc-800 col-span-2"
          >
            Manage Training
          </button>
        )}

        {session.sessionType === "OUTSIDER_PLAY" && (
          <button
            type="button"
            onClick={() => onManageOutsider(session)}
            className="transition-colors w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm sm:w-auto hover:bg-zinc-100 dark:hover:bg-zinc-800 col-span-2"
          >
            Manage Activity
          </button>
        )}

        {session.sessionType === "EVENT" && (
          <button
            type="button"
            onClick={() => onManagePlayers(session)}
            className="transition-colors w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm sm:w-auto hover:bg-zinc-100 dark:hover:bg-zinc-800 col-span-2"
          >
            Manage Event
          </button>
        )}
        <button
          type="button"
          onClick={onViewCharges}
          className="transition-colors col-span-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm sm:w-auto hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          View Charges
        </button>
      </div>
    </div>
  );
}

export default SessionCard;
