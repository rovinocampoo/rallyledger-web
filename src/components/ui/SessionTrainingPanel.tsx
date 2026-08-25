import { useEffect, useState } from "react";
import type { Session } from "../../types/session";
import type { Participant } from "../../types/participant";
import {
  addSessionParticipant,
  getSessionParticipants,
  removeSessionParticipant,
} from "../../api/sessionParticipants";
import { getParticipants } from "../../api/participants";
import ParticipantPicker from "./ParticipantPicker";

type SessionTrainingPanelProps = {
  session: Session;
  onClose: () => void;
};

function SessionTrainingPanel({ session, onClose }: SessionTrainingPanelProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [checkedInParticipantIds, setCheckedInParticipantIds] = useState<
    number[]
  >([]);

  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([getParticipants(), getSessionParticipants(session.id)])
      .then(([participantData, sessionParticipantData]) => {
        if (ignore) {
          return;
        }

        setParticipants(participantData);

        setCheckedInParticipantIds(
          sessionParticipantData.map(
            (sessionParticipant) => sessionParticipant.participantId,
          ),
        );

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);

        if (!ignore) {
          setError("Failed to load training attendance");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [session.id]);

  const availableParticipants = participants.filter(
    (participant) =>
      !participant.isTemporary &&
      !checkedInParticipantIds.includes(participant.id),
  );

  const checkedInParticipants = checkedInParticipantIds
    .map((participantId) =>
      participants.find((participant) => participant.id === participantId),
    )
    .filter((participant): participant is Participant => Boolean(participant));

  async function handleCheckIn() {
    if (!selectedParticipantId) {
      return;
    }

    const participantId = Number(selectedParticipantId);

    try {
      setSaving(true);
      setError(null);

      await addSessionParticipant(session.id, participantId);

      setCheckedInParticipantIds((current) => [...current, participantId]);

      setSelectedParticipantId("");
    } catch (err) {
      console.error(err);
      setError("Failed to check in participant");
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckOut(participantId: number) {
    try {
      setSaving(true);
      setError(null);

      await removeSessionParticipant(session.id, participantId);

      setCheckedInParticipantIds((current) =>
        current.filter((id) => id !== participantId),
      );
    } catch (err) {
      console.error(err);
      setError("Failed to remove participant from training");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Loading training attendance...</p>;
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="text-left">
          <p className="text-sm text-zinc-400">Training</p>

          <h2 className="text-xl font-semibold">{session.name}</h2>

          <p className="mt-1 text-sm text-zinc-500">
            {checkedInParticipants.length} checked in
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

      <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <p className="mb-3 text-left text-sm font-medium text-zinc-400">
          Check In Player
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <ParticipantPicker
            participants={availableParticipants}
            selectedParticipantId={selectedParticipantId}
            onSelect={setSelectedParticipantId}
            placeholder="Search player..."
          />

          <button
            type="button"
            onClick={handleCheckIn}
            disabled={!selectedParticipantId || saving}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {saving ? "Saving..." : "Check In"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-left text-sm font-medium text-zinc-400">
            Attendance
          </p>

          <span className="text-sm text-zinc-500">
            {checkedInParticipants.length}
          </span>
        </div>

        {checkedInParticipants.length === 0 ? (
          <p className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">
            No participants checked in yet.
          </p>
        ) : (
          <div className="space-y-2">
            {checkedInParticipants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
              >
                <div className="min-w-0 text-left">
                  <p className="truncate font-medium">
                    {participant.nickname ||
                      `${participant.firstName} ${participant.lastName}`}
                  </p>

                  <p className="text-xs text-zinc-500">
                    {participant.participantType}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleCheckOut(participant.id)}
                  className="shrink-0 rounded-lg border border-red-900/60 px-3 py-1.5 text-sm text-red-400 disabled:opacity-50"
                >
                  Check Out
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionTrainingPanel;
