import type { Participant } from "../../types/participant";
import { formatFullName } from "../../utils/format";

type ParticipantCardProps = {
  participant: Participant;
  onEdit: (participant: Participant) => void;
  onDelete: (participant: Participant) => void;
  onViewLedger: (participant: Participant) => void;
};

function ParticipantCard({
  participant,
  onEdit,
  onDelete,
  onViewLedger,
}: ParticipantCardProps) {
  const typeStyles: Record<string, string> = {
    MEMBER: "bg-emerald-500/10 text-emerald-400",
    NONMEMBER: "bg-orange-500/10 text-orange-400",
    MMSU_STUDENT: "bg-blue-500/10 text-blue-400",
    MMSU_EMPLOYEE: "bg-violet-500/10 text-violet-400",
    MMSU_VARSITY: "bg-cyan-500/10 text-cyan-400",
  };

  const fullName = formatFullName(participant.firstName, participant.lastName);

  return (
    <>
      {/* MOBILE */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 md:hidden">
        <div className="min-w-0 text-left">
          <p className="truncate text-lg font-semibold" title={fullName}>
            {fullName}
          </p>

          {participant.nickname && (
            <p
              className="mt-1 truncate text-sm text-zinc-500"
              title={participant.nickname}
            >
              {participant.nickname}
            </p>
          )}

          <div className="mt-3">
            <span
              className={`inline-block max-w-full truncate rounded-full px-2.5 py-1 text-xs font-medium ${
                typeStyles[participant.participantType] ??
                "bg-zinc-800 text-zinc-400"
              }`}
            >
              {participant.participantType}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onEdit(participant)}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(participant)}
            className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400"
          >
            Delete
          </button>

          <button
            type="button"
            onClick={() => onViewLedger(participant)}
            className="col-span-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
          >
            View Ledger
          </button>
        </div>
      </div>

      {/* DESKTOP ROW */}
      <div className="hidden grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 border-b border-zinc-800 px-4 py-3 md:grid">
        <div>
          <span
            className={`inline-block max-w-full truncate rounded-full px-2.5 py-1 text-xs font-medium ${
              typeStyles[participant.participantType] ??
              "bg-zinc-800 text-zinc-400"
            }`}
          >
            {participant.participantType}
          </span>
        </div>

        <p className="min-w-0 truncate font-medium" title={fullName}>
          {fullName}
        </p>

        <p
          className="min-w-0 truncate text-sm text-zinc-400"
          title={participant.nickname ?? ""}
        >
          {participant.nickname || "—"}
        </p>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onEdit(participant)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(participant)}
            className="rounded-lg border border-red-900 px-3 py-1.5 text-sm text-red-400"
          >
            Delete
          </button>

          <button
            type="button"
            onClick={() => onViewLedger(participant)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300"
          >
            View Ledger
          </button>
        </div>
      </div>
    </>
  );
}

export default ParticipantCard;
