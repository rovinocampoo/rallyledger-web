import type { SubmitEvent } from "react";
import type { Court } from "../../types/court";
import type { Participant } from "../../types/participant";
import ParticipantPicker from "../ui/ParticipantPicker";
import { formatLabel } from "../../utils/format";
import type { RefObject } from "react";

type MatchDetailsFormProps = {
  editingMatch: boolean;

  courtId: string;
  setCourtId: (value: string) => void;

  matchType: string;
  setMatchType: (value: string) => void;

  lightUsage: "NONE" | "HALF" | "FULL";
  setLightUsage: (value: "NONE" | "HALF" | "FULL") => void;

  activeCourts: Court[];

  teamAPlayer1: string;
  setTeamAPlayer1: (value: string) => void;

  teamAPlayer2: string;
  setTeamAPlayer2: (value: string) => void;

  teamBPlayer1: string;
  setTeamBPlayer1: (value: string) => void;

  teamBPlayer2: string;
  setTeamBPlayer2: (value: string) => void;

  availableForPicker: (currentValue: string) => Participant[];

  showQuickGuest: boolean;
  setShowQuickGuest: (value: boolean) => void;

  quickGuestInputRef: RefObject<HTMLInputElement | null>;

  quickGuestName: string;
  setQuickGuestName: (value: string) => void;

  setQuickGuestTarget: (value: "A1" | "A2" | "B1" | "B2" | null) => void;

  creatingGuest: boolean;
  handleQuickGuest: () => void;

  error: string | null;
  submitting: boolean;

  handleSubmit: (event: SubmitEvent<HTMLFormElement>) => void;

  onCancel: () => void;
};

function MatchDetailsForm({
  editingMatch,
  courtId,
  setCourtId,
  matchType,
  setMatchType,
  lightUsage,
  setLightUsage,
  activeCourts,
  teamAPlayer1,
  setTeamAPlayer1,
  teamAPlayer2,
  setTeamAPlayer2,
  teamBPlayer1,
  setTeamBPlayer1,
  teamBPlayer2,
  setTeamBPlayer2,
  availableForPicker,
  showQuickGuest,
  setShowQuickGuest,
  quickGuestInputRef,
  quickGuestName,
  setQuickGuestName,
  setQuickGuestTarget,
  creatingGuest,
  handleQuickGuest,
  submitting,
  handleSubmit,
  onCancel,
}: MatchDetailsFormProps) {
  return (
    <form onSubmit={handleSubmit}>
      <>
        <div className="grid gap-4 md:grid-cols-2 text-left">
          <label>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Court
            </span>

            <select
              value={courtId}
              onChange={(event) => setCourtId(event.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
            >
              <option value="">
                {activeCourts.length === 0
                  ? "No active courts available"
                  : "Select court"}
              </option>
              {activeCourts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name} - {formatLabel(court.surface)} - {court.location}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Match Type
            </span>

            <select
              value={matchType}
              onChange={(event) => {
                const value = event.target.value;

                setMatchType(value);

                if (value === "SINGLES") {
                  setTeamAPlayer2("");
                  setTeamBPlayer2("");
                }
              }}
              className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
            >
              <option value="SINGLES">Singles</option>

              <option value="DOUBLES">Doubles</option>

              <option value="MIXED_DOUBLES">Mixed Doubles</option>
            </select>
          </label>
        </div>

        <div className="mt-6 text-left">
          <div className="mb-3">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Players
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
              <p className="text-sm font-semibold">Team A</p>

              <div className="mt-4">
                <ParticipantPicker
                  participants={availableForPicker(teamAPlayer1)}
                  selectedParticipantId={teamAPlayer1}
                  onSelect={setTeamAPlayer1}
                  placeholder="Search player..."
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setQuickGuestTarget("A1");
                  setShowQuickGuest(true);
                }}
                className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              >
                + Quick Guest
              </button>

              {matchType !== "SINGLES" && (
                <div className="mt-3">
                  <ParticipantPicker
                    participants={availableForPicker(teamAPlayer2)}
                    selectedParticipantId={teamAPlayer2}
                    onSelect={setTeamAPlayer2}
                    placeholder="Search second player..."
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setQuickGuestTarget("A2");
                      setShowQuickGuest(true);
                    }}
                    className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  >
                    + Quick Guest
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
              <p className="text-sm font-semibold">Team B</p>

              <div className="mt-4">
                <ParticipantPicker
                  participants={availableForPicker(teamBPlayer1)}
                  selectedParticipantId={teamBPlayer1}
                  onSelect={setTeamBPlayer1}
                  placeholder="Search player..."
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setQuickGuestTarget("B1");
                  setShowQuickGuest(true);
                }}
                className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              >
                + Quick Guest
              </button>

              {matchType !== "SINGLES" && (
                <div className="mt-3">
                  <ParticipantPicker
                    participants={availableForPicker(teamBPlayer2)}
                    selectedParticipantId={teamBPlayer2}
                    onSelect={setTeamBPlayer2}
                    placeholder="Search second player..."
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setQuickGuestTarget("B2");
                      setShowQuickGuest(true);
                    }}
                    className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  >
                    + Quick Guest
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {showQuickGuest && (
          <div className="mt-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
            <div className="mb-3">
              <p className="font-medium">Quick Guest</p>
              <p className="text-sm text-zinc-500">
                Add a temporary nonmember to this session.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={quickGuestInputRef}
                type="text"
                value={quickGuestName}
                onChange={(event) => setQuickGuestName(event.target.value)}
                placeholder="Guest name or nickname"
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2"
              />

              <button
                type="button"
                onClick={handleQuickGuest}
                disabled={!quickGuestName.trim() || creatingGuest}
                className="rounded-lg bg-white px-4 py-2 font-medium text-black disabled:opacity-50"
              >
                {creatingGuest ? "Adding..." : "Add Guest"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowQuickGuest(false);
                  setQuickGuestTarget(null);
                  setQuickGuestName("");
                }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </>
      <div className="mt-4 text-left">
        <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
          Lights Usage
        </p>

        <div className="grid grid-cols-3 gap-2">
          {(["NONE", "HALF", "FULL"] as const).map((usage) => (
            <button
              key={usage}
              type="button"
              onClick={() => setLightUsage(usage)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                lightUsage === usage ? "primary-action" : "secondary-action"
              }`}
            >
              {usage === "NONE" ? "None" : usage === "HALF" ? "Half" : "Full"}
            </button>
          ))}
        </div>

        <p className="mt-2 text-xs text-zinc-500">
          Half applies 50% of the normal light fee.
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={submitting || activeCourts.length === 0}
          className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitting
            ? "Saving..."
            : editingMatch
              ? "Update Match"
              : "Create Match"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="transition-colors rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default MatchDetailsForm;
