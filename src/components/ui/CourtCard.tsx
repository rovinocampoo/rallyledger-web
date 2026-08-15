import type { Court } from "../../types/court";
import { formatLabel } from "../../utils/format";

type CourtCardProps = {
  court: Court;
  onEdit: (court: Court) => void;
  onDelete: (court: Court) => void;
};

function CourtCard({ court, onEdit, onDelete }: CourtCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          {/* court name */}
          <h3 className="font-semibold">{court.name}</h3>

          {/* location */}
          <p className="mt-1 text-sm text-zinc-400">{court.location}</p>

          {/* surface */}
          <p className="mt-2 text-xs text-zinc-500">{formatLabel(court.surface)}</p>

          {/* active/inactive */}
          <p className="mt-1 text-xs text-zinc-500">
            {court.isActive ? "Active" : "Inactive"}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Edit button */}
          <button
            type="button"
            onClick={() => onEdit(court)}
            className="text-sm text-zinc-400 hover:text-white"
          >
            Edit
          </button>

          {/* Delete button */}
           <button
            type="button"
            onClick={() => onDelete(court)}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourtCard;
