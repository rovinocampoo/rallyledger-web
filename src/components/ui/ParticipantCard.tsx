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
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div>
        <h2 className="text-xl font-semibold">
          {formatFullName(participant.firstName, participant.lastName)}
        </h2>

        {participant.nickname && (
          <p className="mt-1 text-sm text-zinc-500">{participant.nickname}</p>
        )}
      </div>
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

      <span
        className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
          typeStyles[participant.participantType] ?? "bg-zinc-800 text-zinc-400"
        }`}
      >
        {participant.participantType}
      </span>
    </div>
  );
}

export default ParticipantCard;
