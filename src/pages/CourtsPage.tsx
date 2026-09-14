import { useEffect, useState } from "react";
import type { AdminUser } from "../api/auth";
import { deleteCourt, getCourts } from "../api/courts";
import type { Court } from "../types/court";
import CourtCard from "../components/ui/CourtCard";
import CourtForm from "../components/ui/CourtForm";

type CourtsPageProps = {
  admin: AdminUser;
};

function CourtsPage({ admin }: CourtsPageProps) {
  const canManageCourts = admin.role === "OWNER" || admin.role === "ADMIN";
  const [courts, setCourts] = useState<Court[]>([]);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadCourts() {
      try {
        const data = await getCourts();

        if (!ignore) {
          setCourts(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
          setError("Failed to load courts");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadCourts();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!editingCourt || loading) {
      return;
    }

    const element = document.getElementById(`court-${editingCourt.id}`);

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [editingCourt, loading]);

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

      if (editingCourt?.id === court.id) {
        setEditingCourt(null);
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);

      setActionError(
        err instanceof Error ? err.message : `Failed to delete ${court.name}`,
      );
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
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
            Courts
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage tennis courts.
          </p>
        </div>

        {canManageCourts && (
          <button
            type="button"
            onClick={() => {
              setEditingCourt(null);
              setShowForm(true);
              setActionError(null);
            }}
            className="primary-action w-full rounded-lg px-4 py-3 text-sm font-medium sm:w-auto sm:py-2"
          >
            Add Court
          </button>
        )}
      </div>
      {actionError && (
        <p className="mb-4 text-sm text-red-400">{actionError}</p>
      )}
      {showForm && editingCourt === null && (
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
            <div key={court.id} id={`court-${court.id}`} className="space-y-3">
              <CourtCard
                court={court}
                canManage={canManageCourts}
                onEdit={(court) => {
                  setEditingCourt(court);
                  setShowForm(true);
                  setActionError(null);
                }}
                onDelete={handleCourtDelete}
              />

              {showForm && editingCourt?.id === court.id && (
                <div className="p-3">
                  <CourtForm
                    court={editingCourt}
                    onSaved={handleCourtSaved}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingCourt(null);
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CourtsPage;
