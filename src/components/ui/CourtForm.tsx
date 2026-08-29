import { useState, type SubmitEvent } from "react";
import { createCourt, updateCourt } from "../../api/courts";
import type { Court, CourtInput } from "../../types/court";
import { formatLabel } from "../../utils/format";

type CourtFormProps = {
  court?: Court;
  onSaved: (court: Court) => void;
  onCancel: () => void;
};

function CourtForm({ court, onSaved, onCancel }: CourtFormProps) {
  const [name, setName] = useState(court?.name ?? "");
  const [location, setLocation] = useState(court?.location ?? "Outdoor Court");
  const [surface, setSurface] = useState(court?.surface ?? "HARD");
  const [isActive, setIsActive] = useState(court?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedLocation = location.trim();

    if (!trimmedName) {
      setError("Court name is required.");
      return;
    }

    if (!trimmedLocation) {
      setError("Court location is required.");
      return;
    }
    const data: CourtInput = {
      name: trimmedName,
      location: trimmedLocation,
      surface,
      isActive,
    };

    try {
      setSubmitting(true);
      setError(null);
      let savedCourt: Court;

      if (court) {
        savedCourt = await updateCourt(court.id, data);
      } else {
        savedCourt = await createCourt(data);
      }
      onSaved(savedCourt);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save court");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
    >
      <h2 className="mb-4 text-lg font-semibold">
        {court ? "Edit Court" : "Add Court"}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-left">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Court Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2"
          />
        </label>
        <label className="block text-left">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Location
          </span>

          <input
            type="text"
            list="court-locations"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-white outline-none transition focus:border-zinc-500"
          />

          <datalist id="court-locations">
            <option value="Outdoor Court" />
            <option value="Covered Court" />
          </datalist>
        </label>
        <label className="block text-left">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Surface
          </span>

          <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {["HARD", "CLAY", "GRASS", "SHELL"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSurface(value)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  surface === value ? "primary-action" : "secondary-action"
                }`}
              >
                {formatLabel(value)}
              </button>
            ))}
          </div>
        </label>
        <label className="flex items-center gap-2 self-end rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Active
          </span>
        </label>
      </div>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Saving..." : court ? "Update Court" : "Create Court"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="secondary-action rounded-lg px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default CourtForm;
