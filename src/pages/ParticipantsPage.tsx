import { useEffect, useState } from "react";
import { getParticipants, deleteParticipant } from "../api/participants";
import type { Participant } from "../types/participant";
import ParticipantCard from "../components/ui/ParticipantCard";
import ParticipantForm from "../components/ui/ParticipantForm";
import ParticipantLedgerPanel from "../components/ui/ParticipantLedgerPanel";
import { useLocation, useNavigate } from "react-router-dom";
import { formatFullName } from "../utils/format";

function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [editingParticipant, setEditingParticipant] =
    useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  type ParticipantsPageState = {
    ledgerParticipantId?: number;
  };
  const location = useLocation();
  const navigate = useNavigate();
  const navigationState = location.state as ParticipantsPageState | null;

  const [ledgerParticipantId, setLedgerParticipantId] = useState<number | null>(
    navigationState?.ledgerParticipantId ?? null,
  );
  const ledgerParticipant =
    participants.find(
      (participant) => participant.id === ledgerParticipantId,
    ) ?? null;

  useEffect(() => {
    async function loadParticipants() {
      try {
        setError(null);
        setLoading(true);
        const data = await getParticipants();
        console.log("participants:", data);
        setParticipants(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load participants");
      } finally {
        setLoading(false);
      }
    }

    loadParticipants();
  }, []);

  useEffect(() => {
    if (!location.state) {
      return;
    }

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.state, location.pathname, navigate]);

  function handleParticipantSaved(savedParticipant: Participant) {
    setParticipants((current) => {
      const exists = current.some(
        (participant) => participant.id === savedParticipant.id,
      );

      if (exists) {
        return current.map((participant) =>
          participant.id === savedParticipant.id
            ? savedParticipant
            : participant,
        );
      }

      return [...current, savedParticipant];
    });

    setShowForm(false);
    setEditingParticipant(null);
  }

  if (loading) {
    return <p>Loading participants...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  async function handleParticipantDelete(participant: Participant) {
    const confirmed = window.confirm(
      `Delete ${formatFullName(participant.firstName, participant.lastName)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteParticipant(participant.id);

      setParticipants((current) =>
        current.filter((item) => item.id !== participant.id),
      );
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Participants</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage club members and guests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingParticipant(null);
            setShowForm(true);
          }}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
        >
          Add Participant
        </button>
      </div>
      {showForm && (
        <ParticipantForm
          participant={editingParticipant ?? undefined}
          onSaved={handleParticipantSaved}
          onCancel={() => {
            setShowForm(false);
            setEditingParticipant(null);
          }}
        />
      )}

      {ledgerParticipant && (
        <ParticipantLedgerPanel
          key={ledgerParticipant.id}
          participant={ledgerParticipant}
          onClose={() => setLedgerParticipantId(null)}
        />
      )}
      <div className="space-y-3">
        {participants.map((participant) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            onEdit={(participant) => {
              setEditingParticipant(participant);
              setShowForm(true);
            }}
            onDelete={handleParticipantDelete}
            onViewLedger={(participant) => {
              setLedgerParticipantId(participant.id);
            }}
          />
        ))}{" "}
      </div>
    </div>
  );
}

export default ParticipantsPage;
