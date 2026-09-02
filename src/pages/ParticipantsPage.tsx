import { useEffect, useState } from "react";
import { getParticipants, deleteParticipant } from "../api/participants";
import type { Participant } from "../types/participant";
import ParticipantCard from "../components/ui/ParticipantCard";
import ParticipantForm from "../components/ui/ParticipantForm";
import ParticipantLedgerPanel from "../components/ui/ParticipantLedgerPanel";
import { useLocation, useNavigate } from "react-router-dom";
import { formatFullName } from "../utils/format";
import { getParticipantCategories } from "../api/participantCategories";
import type { ParticipantCategory } from "../types/participantCategory";
import ParticipantCategoryManager from "../components/ui/ParticipantCategoryManager";
import { getParticipantCategoryLabel } from "../utils/participantCategory";

type SortKey = "type" | "name" | "nickname";
type SortDirection = "asc" | "desc";

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [categories, setCategories] = useState<ParticipantCategory[]>([]);
  const [editingParticipant, setEditingParticipant] =
    useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  type ParticipantsPageState = {
    ledgerParticipantId?: number;
  };
  const location = useLocation();
  const navigate = useNavigate();
  const navigationState = location.state as ParticipantsPageState | null;

  const [ledgerParticipantId, setLedgerParticipantId] = useState<number | null>(
    navigationState?.ledgerParticipantId ?? null,
  );
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));

      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  }

  useEffect(() => {
    let ignore = false;

    async function loadParticipants() {
      try {
        const [participantData, categoryData] = await Promise.all([
          getParticipants(),
          getParticipantCategories(),
        ]);

        if (!ignore) {
          setParticipants(participantData);
          setCategories(categoryData);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
          setError("Failed to load participants");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadParticipants();

    return () => {
      ignore = true;
    };
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

  useEffect(() => {
    if (loading) {
      return;
    }

    const targetParticipantId = editingParticipant?.id ?? ledgerParticipantId;

    if (targetParticipantId === null) {
      return;
    }

    const element = document.getElementById(
      `participant-${targetParticipantId}`,
    );

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: ledgerParticipantId !== null ? "start" : "nearest",
    });
  }, [editingParticipant, ledgerParticipantId, loading]);

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

  async function loadCategories() {
    const data = await getParticipantCategories();
    setCategories(data);
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
      setActionError(null);

      await deleteParticipant(participant.id);

      setParticipants((current) =>
        current.filter((item) => item.id !== participant.id),
      );

      setLedgerParticipantId((current) =>
        current === participant.id ? null : current,
      );
    } catch (err) {
      console.error(err);

      setActionError(
        err instanceof Error ? err.message : "Failed to delete participant",
      );
    }
  }

  const filteredParticipants = participants.filter((participant) => {
    const query = normalizeSearchText(searchQuery);

    if (!query) {
      return true;
    }

    const statusSearchMap: Record<string, Participant["membershipStatus"]> = {
      active: "ACTIVE",
      inactive: "INACTIVE",
    };

    const searchedStatus = statusSearchMap[query];

    if (searchedStatus) {
      return participant.membershipStatus === searchedStatus;
    }

    const searchedCategory = categories.find(
      (category) =>
        normalizeSearchText(category.name) === query ||
        normalizeSearchText(category.code) === query,
    );

    if (searchedCategory) {
      return participant.participantType === searchedCategory.code;
    }

    const searchableText = normalizeSearchText(
      [
        participant.firstName,
        participant.lastName,
        participant.nickname,
        formatFullName(participant.firstName, participant.lastName),
        participant.participantType,
        getParticipantCategoryLabel(categories, participant.participantType),
        participant.membershipStatus,
      ].join(" "),
    );

    return searchableText.includes(query);
  });
  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    let aValue = "";
    let bValue = "";

    if (sortKey === "type") {
      aValue = getParticipantCategoryLabel(categories, a.participantType);
      bValue = getParticipantCategoryLabel(categories, b.participantType);
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
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
            Participants
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage club members and guests.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setShowCategories((current) => !current);
              setShowForm(false);
              setEditingParticipant(null);
            }}
            className="secondary-action w-full rounded-lg px-4 py-2 text-sm font-medium sm:w-auto"
          >
            Manage Categories
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingParticipant(null);
              setShowForm(true);
              setShowCategories(false);
            }}
            className="primary-action w-full rounded-lg px-4 py-2 text-sm font-medium sm:w-auto"
          >
            Add Participant
          </button>
        </div>
      </div>
      {actionError && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          {actionError}
        </p>
      )}
      {showCategories && (
        <ParticipantCategoryManager
          categories={categories}
          onChanged={loadCategories}
          onClose={() => setShowCategories(false)}
        />
      )}

      {showForm && editingParticipant === null && (
        <div className="mb-6">
          <ParticipantForm
            categories={categories}
            onSaved={handleParticipantSaved}
            onCancel={() => {
              setShowForm(false);
              setEditingParticipant(null);
            }}
          />
        </div>
      )}

      <div>
        {/* DESKTOP HEADER */}
        <div className="mb-3 flex justify-start">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search players..."
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-zinc-600 md:max-w-md"
          />
        </div>
        <div className="hidden grid-cols-[160px_160px_minmax(0,1fr)_auto] items-center gap-4 rounded-t-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 md:grid">
          <button
            type="button"
            onClick={() => handleSort("type")}
            className="text-left hover:text-zinc-950 dark:hover:text-white"
          >
            Type
            {sortKey === "type" && (sortDirection === "asc" ? " ↑" : " ↓")}
          </button>

          <button
            type="button"
            onClick={() => handleSort("name")}
            className="text-left hover:text-zinc-950 dark:hover:text-white"
          >
            Full Name
            {sortKey === "name" && (sortDirection === "asc" ? " ↑" : " ↓")}
          </button>

          <button
            type="button"
            onClick={() => handleSort("nickname")}
            className="text-left hover:text-zinc-950 dark:hover:text-white"
          >
            Nickname
            {sortKey === "nickname" && (sortDirection === "asc" ? " ↑" : " ↓")}
          </button>

          <span>Actions</span>
        </div>
        <div className="space-y-3 md:space-y-0 md:rounded-b-xl md:border-x md:border-b md:border-zinc-200 dark:border-zinc-800 md:bg-white dark:bg-zinc-900">
          {sortedParticipants.map((participant) => (
            <div key={participant.id} id={`participant-${participant.id}`}>
              <ParticipantCard
                participant={participant}
                participantTypeLabel={getParticipantCategoryLabel(
                  categories,
                  participant.participantType,
                )}
                onEdit={(participant) => {
                  setEditingParticipant(participant);
                  setShowForm(true);
                  setLedgerParticipantId(null);
                }}
                onDelete={handleParticipantDelete}
                onViewLedger={(participant) => {
                  setLedgerParticipantId(participant.id);
                  setEditingParticipant(null);
                  setShowForm(false);
                }}
              />

              {showForm && editingParticipant?.id === participant.id && (
                <div className="p-3">
                  <ParticipantForm
                    participant={editingParticipant}
                    categories={categories}
                    onSaved={handleParticipantSaved}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingParticipant(null);
                    }}
                  />
                </div>
              )}

              {ledgerParticipantId === participant.id && (
                <div className="p-3">
                  <ParticipantLedgerPanel
                    participant={participant}
                    onClose={() => setLedgerParticipantId(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        {sortedParticipants.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">
            No players found.
          </p>
        )}
      </div>
    </div>
  );
}

export default ParticipantsPage;
