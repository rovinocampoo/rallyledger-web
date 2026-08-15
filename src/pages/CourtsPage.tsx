import { useEffect, useState } from "react";
import { deleteCourt, getCourts } from "../api/courts";
import type { Court } from "../types/court";
import CourtCard from "../components/ui/CourtCard";
import CourtForm from "../components/ui/CourtForm";

function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourts() {
      try {
        setError(null);
        setLoading(true);

        const data = await getCourts();

        setCourts(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load courts");
      } finally {
        setLoading(false);
      }
    }

    loadCourts();
  }, []);

  function handleCourtSaved(savedCourt: Court) {
    setCourts((current) => {
      const exists = current.some((court) => court.id === savedCourt.id);
      if (exists) {
        return current.map((court) =>
          court.id === savedCourt.id ? savedCourt : court,
        );
      }

      return [...current, savedCourt];
    });

    setShowForm(false);
    setEditingCourt(null);
  }

  async function handleCourtDelete(court: Court) {
    const confirmed = window.confirm(`Delete ${court.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      setActionError(null);
      await deleteCourt(court.id);

      setCourts((current) => current.filter((item) => item.id !== court.id));
    } catch (err) {
      console.error(err);
      setActionError(`Failed to delete ${court.name}`);
    }
  }
  if (loading) {
    return <p>Loading courts...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h1 className="text-2xl font-bold sm:text-3xl">Courts</h1>
          <p className="mt-1 text-sm text-zinc-400">Manage tennis courts.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black sm:w-auto sm:py-2"
        >
          Add Court
        </button>
      </div>
      {actionError && (
        <p className="mb-4 text-sm text-red-400">{actionError}</p>
      )}
      {showForm && (
        <CourtForm
          court={editingCourt ?? undefined}
          onSaved={handleCourtSaved}
          onCancel={() => {
            setShowForm(false);
            setEditingCourt(null);
          }}
        />
      )}
      <div className="space-y-3">
        {courts.length === 0 ? (
          <p className="text-sm text-zinc-500">No courts yet.</p>
        ) : (
          courts.map((court) => (
            <CourtCard
              key={court.id}
              court={court}
              onEdit={(court) => {
                setEditingCourt(court);
                setShowForm(true);
              }}
              onDelete={handleCourtDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default CourtsPage;
