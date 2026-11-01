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
  onParticipantsChanged?: (participantCount: number) => void;
};

function SessionParticipantsPanel({
  session,
  onClose,
  onParticipantsChanged,
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
      setSaving(true);
      setError(null);
      await addSessionParticipant(session.id, Number(selectedParticipantId));
      const updatedParticipants = await loadSessionParticipants();
      setSelectedParticipantId("");
      onParticipantsChanged?.(updatedParticipants.length);
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
    return data;
  }

  async function handleRemoveParticipant(participantId: number) {
    const confirmed = window.confirm("Remove this player from the session?");

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await removeSessionParticipant(session.id, participantId);
      const updatedParticipants = await loadSessionParticipants();
      onParticipantsChanged?.(updatedParticipants.length);
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
    <section aria-label="Session players" className="mb-6 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#17221B]">
      <div className="flex items-start justify-between gap-3 bg-[#14251B] px-4 py-4 text-white sm:px-5">
        <div className="min-w-0 text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D8C86E]">Players</p>
          <h2 className="mt-1 break-words text-lg font-bold sm:text-xl">{session.name}</h2>
          <p className="mt-1 text-sm text-white/75">
            {session.maxPlayers === null ? `${sessionParticipants.length} players · No capacity limit` : `${sessionParticipants.length} of ${session.maxPlayers} player spaces filled`}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="min-h-10 shrink-0 rounded-lg border border-white/25 px-3 text-sm font-medium text-white hover:bg-white/10"
        >
          Close
        </button>
      </div>
      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {sessionMaxPlayers !== null && (
        <div className="px-4 pt-4 sm:px-5">
          <div role="progressbar" aria-label="Session capacity" aria-valuemin={0} aria-valuemax={sessionMaxPlayers} aria-valuenow={Math.min(sessionParticipants.length, sessionMaxPlayers)} className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
            <div className="h-full rounded-full bg-[#D8C86E] transition-[width]" style={{ width: `${sessionMaxPlayers === 0 ? 0 : Math.min(100, sessionParticipants.length / sessionMaxPlayers * 100)}%` }} />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 px-4 pt-4 sm:flex-row sm:px-5">
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
          className="primary-action min-h-11 w-full rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Add Player
        </button>
      </div>

      <div className="px-4 pb-4 pt-5 sm:px-5 sm:pb-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Roster</h3>
          <span className="text-xs text-stone-500">{sessionParticipants.length} {sessionParticipants.length === 1 ? "player" : "players"}</span>
        </div>
        <div className="divide-y divide-stone-200 dark:divide-stone-800">
        {sessionParticipants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center dark:border-stone-700">
            <p className="text-sm font-medium">No players yet</p>
            <p className="mt-1 text-xs text-stone-500">Search above to add the first player to this session.</p>
          </div>
        ) : (
          sessionParticipants.map((sessionParticipant) => {
            const participant = participants.find(
              (participant) =>
                participant.id === sessionParticipant.participantId,
            );

            return (
              <div
                key={sessionParticipant.participantId}
                className="flex min-w-0 items-center justify-between gap-3 px-2 py-2.5 sm:px-3"
              >
                <div className="min-w-0 flex-1 text-left">
                  <p className="break-words font-medium">
                    {sessionParticipant.nickname ||
                      (participant
                        ? formatFullName(
                            participant.firstName,
                            participant.lastName,
                          )
                        : `Participant #${sessionParticipant.participantId}`)}
                  </p>

                  {participant && sessionParticipant.nickname && (
                    <p className="break-words text-sm text-zinc-500">
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
                  className="min-h-10 shrink-0 rounded-lg px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  Remove
                </button>
              </div>
            );
          })
        )}
        </div>
      </div>
    </section>
  );
}

export default SessionParticipantsPanel;
