import { useMemo, useState } from "react";
import type { Participant } from "../../types/participant";
import { formatFullName } from "../../utils/format";

type ParticipantPickerProps = {
  participants: Participant[];
  selectedParticipantId: string;
  onSelect: (participantId: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

function ParticipantPicker({
  participants,
  selectedParticipantId,
  onSelect,
  disabled = false,
  placeholder = "Search participant...",
}: ParticipantPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredParticipants = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return participants;
    }

    return participants.filter((participant) => {
      const searchableText = [
        participant.nickname,
        participant.firstName,
        participant.lastName,
        `${participant.firstName} ${participant.lastName}`,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [participants, searchTerm]);

  const selectedParticipant = participants.find(
    (participant) => participant.id === Number(selectedParticipantId),
  );

  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={
          selectedParticipant
            ? selectedParticipant.nickname
              ? `${selectedParticipant.nickname} — ${formatFullName(
                  selectedParticipant.firstName,
                  selectedParticipant.lastName,
                )}`
              : formatFullName(
                  selectedParticipant.firstName,
                  selectedParticipant.lastName,
                )
            : searchTerm
        }
        onChange={(event) => {
          setSearchTerm(event.target.value);
          onSelect("");
        }}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
      />

      {!selectedParticipant && searchTerm && !disabled && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 shadow-xl">
          {filteredParticipants.length === 0 ? (
            <p className="px-3 py-3 text-sm text-zinc-500">
              No participants found.
            </p>
          ) : (
            filteredParticipants.map((participant) => (
              <button
                key={participant.id}
                type="button"
                onClick={() => {
                  onSelect(String(participant.id));
                  setSearchTerm("");
                }}
                className="block w-full bg-zinc-50 px-3 py-2 text-left text-zinc-900 transition-colors hover:bg-zinc-200 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800"
              >
                <p className="text-sm font-medium">
                  {participant.nickname ||
                    formatFullName(participant.firstName, participant.lastName)}
                </p>

                {participant.nickname && (
                  <p className="text-xs text-zinc-500">
                    {formatFullName(
                      participant.firstName,
                      participant.lastName,
                    )}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ParticipantPicker;
