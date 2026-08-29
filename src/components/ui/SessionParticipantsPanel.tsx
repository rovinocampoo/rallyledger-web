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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const availableParticipants = participants.filter(
    (participant) =>
      !participant.isTemporary &&
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
          setLoadError("Failed to load session players");
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
      setSaving(true);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to add participant",
      );
    } finally {
      setSaving(false);
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
      setSaving(true);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to remove participant",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Loading session players...</p>;
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>

        <button
          type="button"
          onClick={onClose}
          className="secondary-action mt-3 rounded-lg px-3 py-2 text-sm"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 text-left">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Session Players
          </p>

          <h2 className="truncate text-xl font-semibold">{session.name}</h2>

          <p className="mt-1 text-sm text-zinc-500">
            {session.maxPlayers === null
              ? `${sessionParticipants.length} players · Unlimited`
              : `${sessionParticipants.length} / ${session.maxPlayers} players`}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
        >
          Close
        </button>
      </div>
      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <ParticipantPicker
          participants={availableParticipants}
          selectedParticipantId={selectedParticipantId}
          onSelect={setSelectedParticipantId}
          disabled={sessionIsFull || saving}
          placeholder={
            sessionIsFull ? "Session is full" : "Search participant..."
          }
        />
        <button
          type="button"
          onClick={handleAddParticipant}
          disabled={saving || sessionIsFull || !selectedParticipantId}
          className="primary-action w-full rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
                className="flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-950 px-4 py-3"
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
                  disabled={saving}
                  className="danger-text shrink-0 text-xs disabled:cursor-not-allowed disabled:opacity-50"
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
