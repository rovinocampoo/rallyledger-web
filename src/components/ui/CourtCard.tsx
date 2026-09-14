import type { Court } from "../../types/court";
import { formatLabel } from "../../utils/format";

type CourtCardProps = {
  court: Court;
  canManage: boolean;
  onEdit: (court: Court) => void;
  onDelete: (court: Court) => void;
};

function CourtCard({ court, canManage, onEdit, onDelete }: CourtCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-left">
          <h2 className="truncate text-lg font-semibold">{court.name}</h2>

          <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
            {court.location}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300">
              {formatLabel(court.surface)}
            </span>

            <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300">
              {court.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {canManage && (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <button
              type="button"
              onClick={() => onEdit(court)}
              className="transition-colors rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => onDelete(court)}
              className="danger-action rounded-lg border border-red-900/60 px-4 py-2 text-sm text-red-400"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourtCard;
