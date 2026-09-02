import { useEffect, useRef, useState } from "react";

import type { Session } from "../../types/session";
import type { Participant } from "../../types/participant";
import {
  addSessionParticipant,
  getSessionParticipants,
  removeSessionParticipant,
} from "../../api/sessionParticipants";
import { createParticipant, getParticipants } from "../../api/participants";
import ParticipantPicker from "./ParticipantPicker";
import { generateTrainingCharges, getSessionCharges } from "../../api/charges";
import type { Charge } from "../../types/charge";
import { formatCurrency, formatLabel } from "../../utils/format";
import ParticipantLedgerPanel from "./ParticipantLedgerPanel";

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
  const [showQuickGuest, setShowQuickGuest] = useState(false);
  const [quickGuestName, setQuickGuestName] = useState("");
  const [creatingGuest, setCreatingGuest] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [showCharges, setShowCharges] = useState(false);
  const [generatingCharges, setGeneratingCharges] = useState(false);
  const chargedTrainingParticipantIds = new Set(
    charges
      .filter((charge) => charge.feeType === "TRAINING")
      .map((charge) => charge.participantId),
  );

  const pendingTrainingParticipantIds = checkedInParticipantIds.filter(
    (participantId) => !chargedTrainingParticipantIds.has(participantId),
  );

  const hasPendingTrainingCharges = pendingTrainingParticipantIds.length > 0;
  const chargeRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (showCharges) {
      chargeRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [showCharges]);

  const [ledgerParticipant, setLedgerParticipant] =
    useState<Participant | null>(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([
      getParticipants(),
      getSessionParticipants(session.id),
      getSessionCharges(session.id),
    ])
      .then(([participantData, sessionParticipantData, chargeData]) => {
        if (ignore) {
          return;
        }

        setParticipants(participantData);

        setCheckedInParticipantIds(
          sessionParticipantData.map(
            (sessionParticipant) => sessionParticipant.participantId,
          ),
        );

        setCharges(chargeData);

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);

        if (!ignore) {
          setLoadError("Failed to load training attendance");
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

  const isAtCapacity =
    session.maxPlayers !== null &&
    checkedInParticipantIds.length >= session.maxPlayers;

  async function loadCharges() {
    const data = await getSessionCharges(session.id);
    setCharges(data);
  }

  async function handleCheckIn() {
    if (isAtCapacity) {
      setError("This training session is already full.");
      return;
    }
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
      setError(
        err instanceof Error ? err.message : "Failed to check in participant",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckOut(participantId: number) {
    if (chargedTrainingParticipantIds.has(participantId)) {
      setError(
        "Participants cannot be checked out after charges are generated.",
      );
      return;
    }
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

  async function handleGenerateCharges() {
    if (checkedInParticipants.length === 0) {
      setError("Check in at least one participant first");
      return;
    }

    const confirmed = window.confirm(
      `Generate training charges for ${pendingTrainingParticipantIds.length} checked-in participant${
        pendingTrainingParticipantIds.length === 1 ? "" : "s"
      }?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setGeneratingCharges(true);
      setError(null);

      await generateTrainingCharges(session.id);

      await loadCharges();

      setShowCharges(true);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate training charges",
      );
    } finally {
      setGeneratingCharges(false);
    }
  }

  async function handleQuickGuest() {
    const name = quickGuestName.trim();

    if (isAtCapacity) {
      setError("This training session is already full.");
      return;
    }

    if (!name) {
      setError("Enter a guest name");
      return;
    }

    try {
      setCreatingGuest(true);
      setError(null);

      const guest = await createParticipant({
        firstName: name,
        lastName: "",
        nickname: name,
        birthday: null,
        membershipStatus: "ACTIVE",
        participantType: "NONMEMBER",
        isTemporary: true,
      });

      await addSessionParticipant(session.id, guest.id);

      setParticipants((current) => [...current, guest]);

      setCheckedInParticipantIds((current) => [...current, guest.id]);

      setQuickGuestName("");
      setShowQuickGuest(false);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Failed to create guest");
    } finally {
      setCreatingGuest(false);
    }
  }

  if (loading) {
    return <p>Loading training attendance...</p>;
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
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="text-left">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Training</p>

          <h2 className="text-xl font-semibold">{session.name}</h2>

          <p className="mt-1 text-sm text-zinc-500">
            {checkedInParticipants.length} checked in
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

      <div className="mt-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
        <p className="mb-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Check In Player
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {checkedInParticipants.length}
          {session.maxPlayers !== null ? ` / ${session.maxPlayers}` : ""}{" "}
          checked in
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <ParticipantPicker
            participants={availableParticipants}
            selectedParticipantId={selectedParticipantId}
            onSelect={setSelectedParticipantId}
            disabled={isAtCapacity || saving || creatingGuest}
            placeholder="Search player..."
          />

          <button
            type="button"
            onClick={handleCheckIn}
            disabled={
              !selectedParticipantId || saving || creatingGuest || isAtCapacity
            }
            className="secondary-action rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Check In"}
          </button>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowQuickGuest((current) => !current)}
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
          >
            {showQuickGuest ? "Cancel Quick Guest" : "+ Quick Guest"}
          </button>
        </div>
        {showQuickGuest && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={quickGuestName}
              onChange={(event) => setQuickGuestName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleQuickGuest();
                }
              }}
              placeholder="Guest name"
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />

            <button
              type="button"
              onClick={handleQuickGuest}
              disabled={isAtCapacity || saving || creatingGuest}
              className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {creatingGuest ? "Adding..." : "Add Guest"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Attendance
          </p>

          <span className="text-sm text-zinc-500">
            {checkedInParticipants.length}
          </span>
        </div>

        {checkedInParticipants.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-sm text-zinc-500">
            No participants checked in yet.
          </p>
        ) : (
          <div className="space-y-2">
            {checkedInParticipants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3"
              >
                <div className="min-w-0 text-left">
                  <p className="truncate font-medium">
                    {participant.nickname ||
                      `${participant.firstName} ${participant.lastName}`}
                  </p>

                  <p className="text-xs text-zinc-500">
                    {participant.participantTypeName ||
                      formatLabel(participant.participantType)}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    saving || chargedTrainingParticipantIds.has(participant.id)
                  }
                  onClick={() => handleCheckOut(participant.id)}
                  className="danger-text shrink-0 px-3 py-1.5 text-sm text-red-400 disabled:opacity-50"
                >
                  Check Out
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-left">
              <p className="text-sm font-medium">Training Charges</p>

              <p className="mt-1 text-xs text-zinc-500">
                Training, court, and light fees for checked-in players.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (hasPendingTrainingCharges) {
                    void handleGenerateCharges();
                  } else {
                    setShowCharges((current) => !current);
                  }
                }}
                disabled={
                  generatingCharges || checkedInParticipants.length === 0
                }
                className="primary-action rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                {generatingCharges
                  ? "Generating..."
                  : hasPendingTrainingCharges
                    ? "Generate Charges"
                    : showCharges
                      ? "Hide Charges"
                      : "View Charges"}
              </button>
            </div>
          </div>
        </div>
        {showCharges && (
          <div ref={chargeRef} className="mt-4 space-y-2">
            {charges.length === 0 ? (
              <p className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-sm text-zinc-500">
                No charges generated yet.
              </p>
            ) : (
              charges.map((charge) => {
                const participant = participants.find(
                  (participant) => participant.id === charge.participantId,
                );

                return (
                  <button
                    key={charge.id}
                    type="button"
                    disabled={!participant}
                    onClick={() => {
                      if (participant) {
                        setLedgerParticipant(participant);
                      }
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left transition-colors hover:bg-zinc-100 disabled:cursor-default dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
                  >
                    <div className="min-w-0 text-left">
                      <p className="truncate font-medium">
                        {participant?.nickname ||
                          (participant
                            ? `${participant.firstName} ${participant.lastName}`
                            : `Participant #${charge.participantId}`)}
                      </p>

                      <p className="text-xs text-zinc-500">
                        {formatLabel(charge.feeType)}
                      </p>
                    </div>

                    <p className="shrink-0 font-medium">
                      {formatCurrency(charge.amount)}{" "}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        )}
        {ledgerParticipant && (
          <div className="mt-4">
            <ParticipantLedgerPanel
              participant={ledgerParticipant}
              onClose={() => setLedgerParticipant(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionTrainingPanel;
