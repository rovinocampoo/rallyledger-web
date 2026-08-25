import type { Session } from "../../types/session";
import { formatDate, formatLabel } from "../../utils/format";

type SessionCardProps = {
  session: Session;
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
  onManagePlayers: (session: Session) => void;
  onManageMatches: (session: Session) => void;
  onViewCharges: () => void;
  onManageTraining: (session: Session) => void;
};

function SessionCard({
  session,
  onEdit,
  onDelete,
  onManagePlayers,
  onManageMatches,
  onManageTraining,
  onViewCharges,
}: SessionCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="min-w-0 text-left">
        <h2 className="truncate text-xl font-semibold">{session.name}</h2>

        <p className="mt-2 text-sm text-zinc-400">
          {formatDate(session.sessionDate)}
        </p>

        <p className="mt-1 text-sm text-zinc-500">
          {session.startTime} - {session.endTime}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-zinc-800 px-3 py-1">
          {formatLabel(session.sessionType)}
        </span>
        <span className="rounded-full bg-zinc-800 px-3 py-1">
          {session.maxPlayers === null
            ? "Unlimited players"
            : `Max ${session.maxPlayers} players`}
        </span>
        {session.freeBalls && (
          <span className="rounded-full bg-zinc-800 px-2.5 py-1">
            Free Balls
          </span>
        )}

        {session.freeLights && (
          <span className="rounded-full bg-zinc-800 px-2.5 py-1">
            Free Lights
          </span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
        <button
          type="button"
          onClick={() => onEdit(session)}
          className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm sm:w-auto"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(session)}
          className="w-full rounded-lg border border-red-900/60 px-3 py-2 text-sm text-red-400 sm:w-auto"
        >
          Delete
        </button>
        {session.sessionType === "REGULAR_PLAY" && (
          <button
            type="button"
            onClick={() => onManageMatches(session)}
            className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm sm:w-auto"
          >
            Manage Matches
          </button>
        )}

        {session.sessionType === "TRAINING" && (
          <button
            type="button"
            onClick={() => onManageTraining(session)}
            className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm sm:w-auto"
          >
            Manage Training
          </button>
        )}

        {session.sessionType === "OUTSIDER_PLAY" && (
          <button
            type="button"
            onClick={() => onManagePlayers(session)}
            className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm sm:w-auto"
          >
            Manage Activity
          </button>
        )}

        {session.sessionType === "EVENT" && (
          <button
            type="button"
            onClick={() => onManagePlayers(session)}
            className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm sm:w-auto"
          >
            Manage Event
          </button>
        )}
        <button
          type="button"
          onClick={onViewCharges}
          className="col-span-2 w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm sm:w-auto"
        >
          View Charges
        </button>
      </div>
    </div>
  );
}

export default SessionCard;
