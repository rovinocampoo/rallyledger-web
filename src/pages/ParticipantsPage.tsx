import { useEffect, useState } from "react";
import { getParticipants, deleteParticipant } from "../api/participants";
import type { Participant } from "../types/participant";
import ParticipantCard from "../components/ui/ParticipantCard";
import ParticipantForm from "../components/ui/ParticipantForm";
import ParticipantLedgerPanel from "../components/ui/ParticipantLedgerPanel";
import { useLocation, useNavigate } from "react-router-dom";
import { formatFullName } from "../utils/format";

type SortKey = "type" | "name" | "nickname";
type SortDirection = "asc" | "desc";

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
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));

      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  }

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

  const sortedParticipants = [...participants].sort((a, b) => {
    let aValue = "";
    let bValue = "";

    if (sortKey === "type") {
      aValue = a.participantType;
      bValue = b.participantType;
    }

    if (sortKey === "name") {
      aValue = formatFullName(a.firstName, a.lastName);
      bValue = formatFullName(b.firstName, b.lastName);
    }

    if (sortKey === "nickname") {
      aValue = a.nickname ?? "";
      bValue = b.nickname ?? "";
    }

    const comparison = aValue.localeCompare(bValue, undefined, {
      sensitivity: "base",
    });

    return sortDirection === "asc" ? comparison : -comparison;
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h1 className="text-2xl font-bold sm:text-3xl">Participants</h1>
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
          className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black sm:w-auto"
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
      <div>
        {/* DESKTOP HEADER */}
        <div className="hidden grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 rounded-t-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left text-sm text-zinc-400 md:grid">
          <button
            type="button"
            onClick={() => handleSort("type")}
            className="text-left hover:text-white"
          >
            Type
            {sortKey === "type" && (sortDirection === "asc" ? " ↑" : " ↓")}
          </button>

          <button
            type="button"
            onClick={() => handleSort("name")}
            className="text-left hover:text-white"
          >
            Full Name
            {sortKey === "name" && (sortDirection === "asc" ? " ↑" : " ↓")}
          </button>

          <button
            type="button"
            onClick={() => handleSort("nickname")}
            className="text-left hover:text-white"
          >
            Nickname
            {sortKey === "nickname" && (sortDirection === "asc" ? " ↑" : " ↓")}
          </button>

          <span>Actions</span>
        </div>

        <div className="space-y-3 md:space-y-0 md:rounded-b-xl md:border-x md:border-b md:border-zinc-800 md:bg-zinc-900">
          {sortedParticipants.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              onEdit={(participant) => {
                setEditingParticipant(participant);
                setShowForm(true);
              }}
              onDelete={handleParticipantDelete}
              onViewLedger={(participant) =>
                setLedgerParticipantId(participant.id)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ParticipantsPage;
