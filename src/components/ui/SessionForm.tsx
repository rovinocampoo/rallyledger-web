import { useState, type SubmitEvent } from "react";
import { createSession, updateSession } from "../../api/sessions";
import type { Session } from "../../types/session";

type SessionFormProps = {
  session?: Session;
  onSaved: (session: Session) => void;
  onCancel: () => void;
};

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function SessionForm({ session, onSaved, onCancel }: SessionFormProps) {
  const [name, setName] = useState(session?.name ?? "");
  const [description, setDescription] = useState(session?.description ?? "");
  const [sessionDate, setSessionDate] = useState(
    session?.sessionDate.slice(0, 10) ?? getTodayDate(),
  );
  const [startTime, setStartTime] = useState(session?.startTime ?? "");
  const [endTime, setEndTime] = useState(session?.endTime ?? "");
  const [maxPlayers, setMaxPlayers] = useState(
    session?.maxPlayers?.toString() ?? "",
  );
  const [freeBalls, setFreeBalls] = useState(session?.freeBalls ?? false);
  const [freeLights, setFreeLights] = useState(session?.freeLights ?? false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setFormError(null);

      const parsedMaxPlayers = maxPlayers.trim();
      const data = {
        name,
        description,
        sessionDate,
        startTime,
        endTime,
        maxPlayers: parsedMaxPlayers === "" ? null : Number(parsedMaxPlayers),
        freeBalls,
        freeLights,
      };

      let savedSession: Session;

      if (session) {
        savedSession = await updateSession(session.id, data);
      } else {
        savedSession = await createSession(data);
      }

      onSaved(savedSession);
    } catch (err) {
      console.error(err);

      setFormError(
        err instanceof Error ? err.message : "Failed to save session",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mt-5 w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-left">
            <span className="text-sm text-zinc-400">Session Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-2 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3"
            />
          </label>
          <label className="block text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Description</span>
              <span className="text-xs font-normal text-zinc-500">
                Optional
              </span>
            </div>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
            />
          </label>
          <label className="block min-w-0 text-left">
            <span className="text-sm text-zinc-400">Session Date</span>

            <input
              type="date"
              value={sessionDate}
              onChange={(event) => setSessionDate(event.target.value)}
              className="mt-2 block w-full min-w-0 max-w-full box-border rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3"
            />
          </label>

          <label className="block text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Max Players</span>
              <span className="text-xs font-normal text-zinc-500">
                Optional
              </span>
            </div>{" "}
            <input
              type="number"
              min="1"
              value={maxPlayers}
              onChange={(event) => setMaxPlayers(event.target.value)}
              placeholder="Unlimited"
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
            />
          </label>

          <label className="block text-left">
            <span className="text-sm text-zinc-400">Start Time</span>
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
            />
          </label>

          <label className="block text-left">
            <span className="text-sm text-zinc-400">End Time</span>
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={freeBalls}
              onChange={(event) => setFreeBalls(event.target.checked)}
            />
            <span className="text-sm">Free Balls</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={freeLights}
              onChange={(event) => setFreeLights(event.target.checked)}
            />
            <span className="text-sm">Free Lights</span>
          </label>
        </div>

        {formError && <p className="mt-4 text-sm text-red-400">{formError}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {submitting
              ? "Saving..."
              : session
                ? "Update Session"
                : "Create Session"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

export default SessionForm;
