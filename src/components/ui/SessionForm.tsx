import { useState, type SubmitEvent } from "react";
import { createSession, updateSession } from "../../api/sessions";
import {
  type LightUsage,
  type Session,
  type SessionType,
} from "../../types/session";
import { formatLabel } from "../../utils/format";

type SessionFormProps = {
  session?: Session;
  initialSessionType?: SessionType;
  initialValues?: {
    sessionDate?: string;
    startTime?: string;
    endTime?: string;
  };
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

function SessionForm({
  session,
  initialSessionType,
  initialValues,
  onSaved,
  onCancel,
}: SessionFormProps) {
  const [name, setName] = useState(session?.name ?? "");
  const [description, setDescription] = useState(session?.description ?? "");
  const [sessionType, setSessionType] = useState<SessionType>(
    session?.sessionType ?? initialSessionType ?? "REGULAR_PLAY",
  );
  const [sessionDate, setSessionDate] = useState(
    session?.sessionDate.slice(0, 10) ??
      initialValues?.sessionDate ??
      getTodayDate(),
  );
  const [startTime, setStartTime] = useState(
    session?.startTime ?? initialValues?.startTime ?? "",
  );
  const [endTime, setEndTime] = useState(
    session?.endTime ?? initialValues?.endTime ?? "",
  );
  const [maxPlayers, setMaxPlayers] = useState(
    session?.maxPlayers?.toString() ?? "",
  );
  const [freeBalls, setFreeBalls] = useState(session?.freeBalls ?? false);
  const [freeLights, setFreeLights] = useState(session?.freeLights ?? false);
  const [lightUsage, setLightUsage] = useState<LightUsage>(
    session?.lightUsage ?? "NONE",
  );

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedMaxPlayers =
      maxPlayers.trim() === "" ? null : Number(maxPlayers);

    if (!name.trim()) {
      setFormError("Session name is required.");
      return;
    }

    if (!sessionDate || !startTime || !endTime) {
      setFormError("Date, start time, and end time are required.");
      return;
    }

    if (endTime <= startTime) {
      setFormError("End time must be after start time.");
      return;
    }

    if (
      parsedMaxPlayers !== null &&
      (!Number.isInteger(parsedMaxPlayers) || parsedMaxPlayers < 1)
    ) {
      setFormError("Max players must be a positive whole number.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const data = {
        name,
        description,
        sessionType,
        sessionDate,
        startTime,
        endTime,
        maxPlayers: maxPlayers.trim() === "" ? null : parsedMaxPlayers,
        freeBalls,
        freeLights,
        lightUsage,
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
      <div className="mt-5 w-full min-w-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-left md:col-span-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Session Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-2 w-full min-w-0 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-left">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Activity Type
            </span>

            <select
              value={sessionType}
              onChange={(event) =>
                setSessionType(event.target.value as SessionType)
              }
              className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-3"
            >
              <option value="REGULAR_PLAY">Regular Play</option>
              <option value="TRAINING">Training</option>
              <option value="OUTSIDER_PLAY">Outsider Play</option>
              <option value="EVENT">Event</option>
            </select>
          </label>
          <label className="block text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Description
              </span>
              <span className="text-xs font-normal text-zinc-500">
                Optional
              </span>
            </div>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2"
            />
          </label>
          <label className="block min-w-0 text-left">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Session Date
            </span>

            <input
              type="date"
              value={sessionDate}
              required
              onChange={(event) => setSessionDate(event.target.value)}
              className="mt-2 block w-full min-w-0 max-w-full box-border rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-3"
            />
          </label>

          <label className="block text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Max Players
              </span>
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
              className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2"
            />
          </label>

          <label className="block text-left">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Start Time
            </span>
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
              className="dark:[color-scheme:dark] mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2"
            />
          </label>

          <label className="block text-left">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              End Time
            </span>
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              required
              className="dark:[color-scheme:dark] mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2"
            />
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
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
          {sessionType === "TRAINING" && !freeLights && (
            <div className="block text-left">
              <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                Light Usage
              </p>

              <div className="grid grid-cols-3 gap-2 sm:flex">
                {(["NONE", "HALF", "FULL"] as const).map((usage) => (
                  <button
                    key={usage}
                    type="button"
                    onClick={() => setLightUsage(usage)}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      lightUsage === usage
                        ? "primary-action"
                        : "secondary-action"
                    }`}
                  >
                    {formatLabel(usage)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {formError && <p className="mt-4 text-sm text-red-400">{formError}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
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
            className="transition-colors rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

export default SessionForm;
