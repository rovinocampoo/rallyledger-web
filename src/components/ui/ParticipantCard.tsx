import type { Participant } from "../../types/participant";
import { formatFullName, formatLabel } from "../../utils/format";

type ParticipantCardProps = {
  participant: Participant;
  participantTypeLabel: string;
  onEdit: (participant: Participant) => void;
  onDelete: (participant: Participant) => void;
  onViewLedger: (participant: Participant) => void;
  canManage: boolean;
};

function ParticipantCard({
  participant,
  participantTypeLabel,
  onEdit,
  onDelete,
  onViewLedger,
  canManage,
}: ParticipantCardProps) {
  const typeStyles: Record<string, string> = {
    MEMBER: "bg-emerald-500/10 text-emerald-400",
    NONMEMBER: "bg-orange-500/10 text-orange-400",
    MMSU_STUDENT: "bg-blue-500/10 text-blue-400",
    MMSU_EMPLOYEE: "bg-violet-500/10 text-violet-400",
    MMSU_VARSITY: "bg-cyan-500/10 text-cyan-400",
  };

  function getMembershipStatusStyle(status: string) {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/10 text-emerald-400";

      case "INACTIVE":
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400";

      case "EXPIRED":
        return "bg-amber-500/10 text-amber-400";

      case "SUSPENDED":
        return "bg-orange-500/10 text-orange-400";

      case "REVOKED":
        return "bg-red-500/10 text-red-400";

      case "HONORARY":
        return "bg-yellow-500/10 text-yellow-400";

      default:
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400";
    }
  }

  const fullName = formatFullName(participant.firstName, participant.lastName);

  return (
    <>
      {/* MOBILE */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white md:hidden">
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

          <div className="mt-3 flex flex-row flex-wrap gap-2 md:flex-col md:items-start md:gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[13px] font-medium ${getMembershipStatusStyle(
                participant.membershipStatus,
              )}`}
            >
              {formatLabel(participant.membershipStatus)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[13px] font-medium ${
                typeStyles[participant.participantType] ??
                "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {participantTypeLabel}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {canManage && (
            <button
              type="button"
              onClick={() => onEdit(participant)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              Edit
            </button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={() => onDelete(participant)}
              className="danger-action rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400"
            >
              Delete
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewLedger(participant)}
            className="col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            View Ledger
          </button>
        </div>
      </div>

      {/* DESKTOP ROW */}

      <div className="hidden grid-cols-[160px_160px_minmax(0,1fr)_auto] items-center gap-4 border-b border-zinc-200 bg-white px-4 py-3 text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 md:grid">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium sm:text-[12px] ${getMembershipStatusStyle(
              participant.membershipStatus,
            )}`}
          >
            {formatLabel(participant.membershipStatus)}
          </span>

          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium sm:text-[12px] ${
              typeStyles[participant.participantType] ??
              "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {participantTypeLabel}
          </span>
        </div>
        <p className="min-w-0 truncate  text-[14px] text-left" title={fullName}>
          {fullName}
        </p>

        <p
          className="min-w-0 truncate  text-[13px] text-zinc-600 dark:text-zinc-400 text-left"
          title={participant.nickname ?? ""}
        >
          {participant.nickname || "—"}
        </p>

        <div className="flex shrink-0 gap-2">
          {canManage && (
            <button
              type="button"
              onClick={() => onEdit(participant)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              Edit
            </button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={() => onDelete(participant)}
              className="danger-action rounded-lg border border-red-900 px-3 py-1.5 text-sm text-red-400"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={() => onViewLedger(participant)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            View Ledger
          </button>
        </div>
      </div>
    </>
  );
}

export default ParticipantCard;
