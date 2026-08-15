import { useEffect, useState } from "react";
import {
  addSessionParticipant,
  getSessionParticipants,
  removeSessionParticipant,
} from "../../api/sessionParticipants";
import { getParticipants } from "../../api/participants";
import type { Session } from "../../types/session";
import type { Participant } from "../../types/participant";
import type { SessionParticipant } from "../../types/sessionParticipant";
import { formatFullName } from "../../utils/format";
import ParticipantPicker from "../ui/ParticipantPicker";

type SessionParticipantsPanelProps = {
  session: Session;
  onClose: () => void;
};

function SessionParticipantsPanel({
  session,
  onClose,
}: SessionParticipantsPanelProps) {
  const [sessionParticipants, setSessionParticipants] = useState<
    SessionParticipant[]
  >([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const availableParticipants = participants.filter(
    (participant) =>
      !sessionParticipants.some(
        (sessionParticipant) =>
          sessionParticipant.participantId === participant.id,
      ),
  );
  const sessionMaxPlayers = session.maxPlayers ?? null;
  const sessionIsFull =
    sessionMaxPlayers !== null &&
    sessionParticipants.length >= sessionMaxPlayers;

  useEffect(() => {
    let ignore = false;

    Promise.all([getSessionParticipants(session.id), getParticipants()])
      .then(([sessionParticipantData, participantData]) => {
        if (!ignore) {
          setSessionParticipants(sessionParticipantData);
          setParticipants(participantData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError("Failed to load session players");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [session.id]);

  async function handleAddParticipant() {
    if (!selectedParticipantId) {
      return;
    }

    try {
      await addSessionParticipant(session.id, Number(selectedParticipantId));
      await loadSessionParticipants();
      setSelectedParticipantId("");
    } catch (err) {
      console.error(err);
      setError("Failed to add participant");
    }
  }

  async function loadSessionParticipants() {
    const data = await getSessionParticipants(session.id);
    setSessionParticipants(data);
  }

  async function handleRemoveParticipant(participantId: number) {
    const confirmed = window.confirm("Remove this player from the session?");

    if (!confirmed) {
      return;
    }

    try {
      await removeSessionParticipant(session.id, participantId);
      await loadSessionParticipants();
    } catch (err) {
      console.error(err);
      setError("Failed to remove participant");
    }
  }

  if (loading) {
    return <p>Loading session players...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 text-left">
          <p className="text-sm text-zinc-400">Session Players</p>

          <h2 className="truncate text-xl font-semibold">{session.name}</h2>

          <p className="mt-1 text-sm text-zinc-500">
            {session.maxPlayers === null
              ? `${participants.length} players · Unlimited`
              : `${participants.length} / ${session.maxPlayers} players`}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-sm text-zinc-400 hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="mt-5 flex gap-2">
        <ParticipantPicker
          participants={availableParticipants}
          selectedParticipantId={selectedParticipantId}
          onSelect={setSelectedParticipantId}
          disabled={sessionIsFull}
          placeholder={
            sessionIsFull ? "Session is full" : "Search participant..."
          }
        />

        <button
          type="button"
          onClick={handleAddParticipant}
          disabled={sessionIsFull || !selectedParticipantId}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add Player
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {sessionParticipants.length === 0 ? (
          <p className="text-sm text-zinc-500">No players added yet.</p>
        ) : (
          sessionParticipants.map((sessionParticipant) => {
            const participant = participants.find(
              (participant) =>
                participant.id === sessionParticipant.participantId,
            );

            return (
              <div
                key={sessionParticipant.participantId}
                className="flex items-center justify-between rounded-lg bg-zinc-950 px-4 py-3"
              >
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate font-medium">
                    {sessionParticipant.nickname ||
                      (participant
                        ? formatFullName(
                            participant.firstName,
                            participant.lastName,
                          )
                        : `Participant #${sessionParticipant.participantId}`)}
                  </p>

                  {participant && sessionParticipant.nickname && (
                    <p className="truncate text-sm text-zinc-500">
                      {formatFullName(
                        participant.firstName,
                        participant.lastName,
                      )}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleRemoveParticipant(sessionParticipant.participantId)
                  }
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SessionParticipantsPanel;
