import { useEffect, useState } from "react";
import type { Session } from "../../types/session";
import type { Participant } from "../../types/participant";
import {
  generateBallRentalCharge,
  generateRacketRentalCharge,
  generateOutsiderCourtCharge,
  getSessionCharges,
} from "../../api/charges";
import { createParticipant, getParticipants } from "../../api/participants";
import {
  addSessionParticipant,
  getSessionParticipants,
  removeSessionParticipant,
} from "../../api/sessionParticipants";

import ParticipantPicker from "../ui/ParticipantPicker";
import ChargeEditForm from "../ui/ChargeEditForm";
import ChargeAdjustmentHistory from "../ui/ChargeAdjustmentHistory";
import type { AdminUser } from "../../api/auth";
import type { Charge } from "../../types/charge";
import { formatCurrency, formatLabel } from "../../utils/format";

type SessionOutsiderPanelProps = {
  session: Session;
  admin: AdminUser;
  onClose: () => void;
};

function SessionOutsiderPanel({
  session,
  admin,
  onClose,
}: SessionOutsiderPanelProps) {
  const canRemoveParticipants =
    admin.role === "OWNER" || admin.role === "ADMIN";
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sessionParticipantIds, setSessionParticipantIds] = useState<number[]>(
    [],
  );
  const [showQuickGuest, setShowQuickGuest] = useState(false);
  const [quickGuestName, setQuickGuestName] = useState("");
  const [creatingGuest, setCreatingGuest] = useState(false);
  const [charges, setCharges] = useState<Charge[]>([]);

  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [ballRentalPayerId, setBallRentalPayerId] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBallRentalCharge, setShowBallRentalCharge] = useState(false);
  const [generatingBallRental, setGeneratingBallRental] = useState(false);
  const [racketRentalParticipantId, setRacketRentalParticipantId] =
    useState("");
  const [generatingRacketRental, setGeneratingRacketRental] = useState(false);

  const [outsiderCourtParticipantId, setOutsiderCourtParticipantId] =
    useState("");
  const [generatingOutsiderCourt, setGeneratingOutsiderCourt] = useState(false);
  const [editingChargeId, setEditingChargeId] = useState<number | null>(null);

  const [lastAdjustedChargeId, setLastAdjustedChargeId] = useState<
    number | null
  >(null);

  const availableParticipants = participants.filter(
    (participant) =>
      !participant.isTemporary &&
      !sessionParticipantIds.includes(participant.id),
  );

  const sessionParticipants = sessionParticipantIds
    .map((participantId) =>
      participants.find((participant) => participant.id === participantId),
    )
    .filter((participant): participant is Participant => Boolean(participant));

  const ballRentalCharge = charges.find(
    (charge) => charge.feeType === "BALL_RENTAL",
  );

  const racketRentalCharges = charges.filter(
    (charge) => charge.feeType === "RACKET_RENTAL",
  );

  const racketRentalParticipantIds = new Set(
    racketRentalCharges.map((charge) => charge.participantId),
  );

  const availableRacketRenters = sessionParticipants.filter(
    (participant) => !racketRentalParticipantIds.has(participant.id),
  );

  const outsiderCourtCharges = charges.filter(
    (charge) => charge.matchId === null && charge.feeType === "COURT",
  );

  const outsiderCourtParticipantIds = new Set(
    outsiderCourtCharges.map((charge) => charge.participantId),
  );

  const availableOutsiderCourtParticipants = sessionParticipants.filter(
    (participant) =>
      participant.participantType === "NONMEMBER" &&
      !outsiderCourtParticipantIds.has(participant.id),
  );

  const chargedRentalParticipantIds = new Set(
    charges
      .filter(
        (charge) =>
          charge.feeType === "BALL_RENTAL" ||
          charge.feeType === "RACKET_RENTAL",
      )
      .map((charge) => charge.participantId),
  );

  const isAtCapacity =
    session.maxPlayers !== null &&
    sessionParticipantIds.length >= session.maxPlayers;

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

        setSessionParticipantIds(
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
          setLoadError("Failed to load outsider activity");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [session.id]);

  async function handleAddParticipant() {
    if (isAtCapacity) {
      setError("This outsider play session is already full.");
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

      setSessionParticipantIds((current) => [...current, participantId]);
      setSelectedParticipantId("");
    } catch (err) {
      console.error(err);
      setError("Failed to add participant");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickGuest() {
    if (isAtCapacity) {
      setError("This outsider play session is already full.");
      return;
    }
    const name = quickGuestName.trim();

    if (!name) {
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

      setSessionParticipantIds((current) => [...current, guest.id]);

      setQuickGuestName("");
      setShowQuickGuest(false);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Failed to create quick guest",
      );
    } finally {
      setCreatingGuest(false);
    }
  }

  async function handleRemoveParticipant(participantId: number) {
    try {
      if (chargedRentalParticipantIds.has(participantId)) {
        setError(
          "This participant cannot be removed after a rental charge is generated.",
        );
        return;
      }
      setSaving(true);
      setError(null);

      await removeSessionParticipant(session.id, participantId);

      setSessionParticipantIds((current) =>
        current.filter((id) => id !== participantId),
      );

      if (ballRentalPayerId === String(participantId)) {
        setBallRentalPayerId("");
      }
      if (racketRentalParticipantId === String(participantId)) {
        setRacketRentalParticipantId("");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to remove participant");
    } finally {
      setSaving(false);
    }
  }

  async function handleBallRental() {
    if (ballRentalCharge) {
      setShowBallRentalCharge((current) => !current);
      return;
    }

    if (!ballRentalPayerId) {
      setError("Choose who will pay the ball rental");
      return;
    }

    if (generatingBallRental) {
      return;
    }

    try {
      setGeneratingBallRental(true);
      setError(null);

      const createdCharge = await generateBallRentalCharge(
        session.id,
        Number(ballRentalPayerId),
      );

      setCharges((current) =>
        current.some((charge) => charge.id === createdCharge.id)
          ? current
          : [...current, createdCharge],
      );

      setShowBallRentalCharge(true);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate ball rental charge",
      );
    } finally {
      setGeneratingBallRental(false);
    }
  }

  async function handleRacketRental() {
    if (!racketRentalParticipantId || generatingRacketRental) {
      return;
    }

    try {
      setGeneratingRacketRental(true);
      setError(null);

      const createdCharge = await generateRacketRentalCharge(
        session.id,
        Number(racketRentalParticipantId),
      );

      setCharges((current) =>
        current.some((charge) => charge.id === createdCharge.id)
          ? current
          : [...current, createdCharge],
      );

      setRacketRentalParticipantId("");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate racket rental charge",
      );
    } finally {
      setGeneratingRacketRental(false);
    }
  }

  async function handleOutsiderCourt() {
    if (!outsiderCourtParticipantId) {
      return;
    }

    try {
      setGeneratingOutsiderCourt(true);
      setError(null);

      await generateOutsiderCourtCharge(
        session.id,
        Number(outsiderCourtParticipantId),
      );

      const updatedCharges = await getSessionCharges(session.id);

      setCharges(updatedCharges);
      setOutsiderCourtParticipantId("");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate outsider Court charge",
      );
    } finally {
      setGeneratingOutsiderCourt(false);
    }
  }

  if (loading) {
    return <p>Loading outsider activity...</p>;
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
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Outsider Play
          </p>
          <h2 className="text-xl font-semibold">{session.name}</h2>

          <p className="mt-1 text-sm text-zinc-500">
            {sessionParticipants.length} participants
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
          Add Participant
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
            onClick={handleAddParticipant}
            disabled={!selectedParticipantId || saving}
            className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Add"}
          </button>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              setShowQuickGuest((current) => !current);
              setQuickGuestName("");
              setError(null);
            }}
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
          >
            {showQuickGuest ? "Cancel Quick Guest" : "+ Quick Guest"}
          </button>

          {showQuickGuest && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={quickGuestName}
                onChange={(event) => setQuickGuestName(event.target.value)}
                placeholder="Guest name"
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />

              <button
                type="button"
                onClick={handleQuickGuest}
                disabled={!quickGuestName.trim() || creatingGuest}
                className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {creatingGuest ? "Adding..." : "Add Guest"}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="mt-5 space-y-2">
        {sessionParticipants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3"
          >
            <div className="text-left">
              <p className="font-medium">
                {participant.nickname ||
                  `${participant.firstName} ${participant.lastName}`}
              </p>

              <p className="text-xs text-zinc-500">
                {participant.participantTypeName ||
                  formatLabel(participant.participantType)}
              </p>
            </div>

            {canRemoveParticipants && (
              <button
                type="button"
                onClick={() => handleRemoveParticipant(participant.id)}
                disabled={
                  saving || chargedRentalParticipantIds.has(participant.id)
                }
                className="danger-text text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
        <p className="text-left text-sm font-medium">Ball Rental</p>

        <p className="mt-1 text-left text-xs text-zinc-500">
          One flat rental charge for the session. Choose one participant as
          payer.
        </p>

        {!ballRentalCharge && (
          <select
            value={ballRentalPayerId}
            onChange={(event) => setBallRentalPayerId(event.target.value)}
            className="mt-3 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          >
            <option value="">Choose payer...</option>

            {sessionParticipants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.nickname ||
                  `${participant.firstName} ${participant.lastName}`}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={handleBallRental}
          disabled={
            generatingBallRental || (!ballRentalCharge && !ballRentalPayerId)
          }
          className="secondary-action mt-3 rounded-lg px-4 py-2 w-full text-sm"
        >
          {generatingBallRental
            ? "Generating..."
            : ballRentalCharge
              ? showBallRentalCharge
                ? "Hide Charge"
                : "View Charge"
              : "Generate Charge"}
        </button>

        {showBallRentalCharge && ballRentalCharge && (
          <div className="mt-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-left">
                <p className="font-medium">Ball Rental</p>

                <p className="text-xs text-zinc-500">
                  {(() => {
                    const payer = participants.find(
                      (participant) =>
                        participant.id === ballRentalCharge.participantId,
                    );

                    return (
                      payer?.nickname ||
                      (payer
                        ? `${payer.firstName} ${payer.lastName}`
                        : `Participant #${ballRentalCharge.participantId}`)
                    );
                  })()}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <p className="font-medium">
                  {formatCurrency(ballRentalCharge.amount)}
                </p>

                <button
                  type="button"
                  onClick={() => setEditingChargeId(ballRentalCharge.id)}
                  className="text-xs text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                >
                  Edit
                </button>
              </div>
            </div>
            {editingChargeId === ballRentalCharge.id && (
              <div className="mt-2">
                <ChargeEditForm
                  charge={ballRentalCharge}
                  onSaved={(updatedCharge) => {
                    setCharges((current) =>
                      current.map((item) =>
                        item.id === updatedCharge.id ? updatedCharge : item,
                      ),
                    );

                    setEditingChargeId(null);
                    setLastAdjustedChargeId(updatedCharge.id);
                  }}
                  onCancel={() => setEditingChargeId(null)}
                />
              </div>
            )}

            <ChargeAdjustmentHistory
              chargeId={ballRentalCharge.id}
              initiallyOpen={lastAdjustedChargeId === ballRentalCharge.id}
            />
          </div>
        )}
      </div>
      <div className="mt-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
        <p className="text-left text-sm font-medium">Racket Rental</p>

        <p className="mt-1 text-left text-xs text-zinc-500">
          One rental charge per participant who rents a racket.
        </p>

        {availableRacketRenters.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select
              value={racketRentalParticipantId}
              onChange={(event) =>
                setRacketRentalParticipantId(event.target.value)
              }
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <option value="">Choose renter...</option>

              {availableRacketRenters.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.nickname ||
                    `${participant.firstName} ${participant.lastName}`}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleRacketRental}
              disabled={!racketRentalParticipantId || generatingRacketRental}
              className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {generatingRacketRental ? "Generating..." : "Add Rental"}
            </button>
          </div>
        )}

        {racketRentalCharges.length > 0 && (
          <div className="mt-4 space-y-2">
            {racketRentalCharges.map((charge) => {
              const renter = participants.find(
                (participant) => participant.id === charge.participantId,
              );

              return (
                <div key={charge.id}>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="min-w-0 text-left">
                      <p className="font-medium">
                        {renter?.nickname ||
                          (renter
                            ? `${renter.firstName} ${renter.lastName}`
                            : `Participant #${charge.participantId}`)}
                      </p>

                      <p className="text-xs text-zinc-500">Racket Rental</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <p className="font-medium">
                        {formatCurrency(charge.amount)}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingChargeId(charge.id);
                          setLastAdjustedChargeId(null);
                        }}
                        className="text-xs text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {editingChargeId === charge.id && (
                    <div className="mt-2">
                      <ChargeEditForm
                        charge={charge}
                        onSaved={(updatedCharge) => {
                          setCharges((current) =>
                            current.map((item) =>
                              item.id === updatedCharge.id
                                ? updatedCharge
                                : item,
                            ),
                          );

                          setEditingChargeId(null);
                          setLastAdjustedChargeId(updatedCharge.id);
                        }}
                        onCancel={() => setEditingChargeId(null)}
                      />
                    </div>
                  )}

                  <ChargeAdjustmentHistory
                    chargeId={charge.id}
                    initiallyOpen={lastAdjustedChargeId === charge.id}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-left text-sm font-medium">Court Fee</p>

        <p className="mt-1 text-left text-xs text-zinc-500">
          Add one Court charge for an eligible Nonmember attendee.
        </p>

        {availableOutsiderCourtParticipants.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select
              value={outsiderCourtParticipantId}
              onChange={(event) =>
                setOutsiderCourtParticipantId(event.target.value)
              }
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <option value="">Choose Nonmember...</option>

              {availableOutsiderCourtParticipants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.nickname ||
                    `${participant.firstName} ${participant.lastName}`}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleOutsiderCourt}
              disabled={!outsiderCourtParticipantId || generatingOutsiderCourt}
              className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {generatingOutsiderCourt ? "Generating..." : "Add Court Fee"}
            </button>
          </div>
        )}

        {outsiderCourtCharges.map((charge) => {
          const participant = participants.find(
            (item) => item.id === charge.participantId,
          );

          return (
            <div key={charge.id}>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="min-w-0 text-left">
                  <p className="font-medium">
                    {participant?.nickname ||
                      (participant
                        ? `${participant.firstName} ${participant.lastName}`
                        : `Participant #${charge.participantId}`)}
                  </p>

                  <p className="text-xs text-zinc-500">Court Fee</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <p className="font-medium">{formatCurrency(charge.amount)}</p>

                  <button
                    type="button"
                    onClick={() => setEditingChargeId(charge.id)}
                    className="text-xs text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {editingChargeId === charge.id && (
                <div className="mt-2">
                  <ChargeEditForm
                    charge={charge}
                    onSaved={(updatedCharge) => {
                      setCharges((current) =>
                        current.map((item) =>
                          item.id === updatedCharge.id ? updatedCharge : item,
                        ),
                      );

                      setEditingChargeId(null);
                      setLastAdjustedChargeId(updatedCharge.id);
                    }}
                    onCancel={() => setEditingChargeId(null)}
                  />
                </div>
              )}

              <ChargeAdjustmentHistory
                chargeId={charge.id}
                initiallyOpen={lastAdjustedChargeId === charge.id}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SessionOutsiderPanel;
