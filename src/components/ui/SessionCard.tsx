import type { Session } from "../../types/session";

type SessionCardProps = {
  session: Session;
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
  onManagePlayers: (session: Session) => void;
  onManageMatches: (session: Session) => void;
  onViewCharges: () => void;
};

function SessionCard({
  session,
  onEdit,
  onDelete,
  onManagePlayers,
  onManageMatches,
  onViewCharges,
}: SessionCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="font-semibold">{session.name}</h2>

      <p className="mt-1 text-sm text-zinc-400">{session.sessionDate}</p>

      <p className="mt-1 text-sm text-zinc-500">
        {session.startTime} - {session.endTime}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-zinc-800 px-2.5 py-1">
          Max {session.maxPlayers} players
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
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(session)}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(session)}
          className="rounded-lg border border-red-900 px-3 py-1.5 text-sm text-red-400"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => onManagePlayers(session)}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300"
        >
          Manage Players
        </button>
        <button
          type="button"
          onClick={() => onManageMatches(session)}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300"
        >
          Manage Matches
        </button>
        <button
          type="button"
          onClick={onViewCharges}
          className="text-sm text-zinc-300"
        >
          View Charges
        </button>
      </div>
    </div>
  );
}

export default SessionCard;
