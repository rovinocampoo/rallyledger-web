import type { Dispatch, SetStateAction, SubmitEvent } from "react";
import type { Court } from "../../types/court";
import type { Participant } from "../../types/participant";
import ParticipantPicker from "../ui/ParticipantPicker";
import { formatFullName, formatLabel } from "../../utils/format";
import type { RefObject } from "react";

type QuickGuestTarget = "A1" | "A2" | "B1" | "B2" | null;

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
  quickGuestTarget: QuickGuestTarget;
  setQuickGuestTarget: Dispatch<SetStateAction<QuickGuestTarget>>;
  creatingGuest: boolean;
  handleQuickGuest: () => void;
  quickGuestError: string | null;
  clearQuickGuestError: () => void;
  error: string | null;
  submitting: boolean;
  handleSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

const formats = [
  { value: "SINGLES", label: "Singles" },
  { value: "DOUBLES", label: "Doubles" },
  { value: "MIXED_DOUBLES", label: "Mixed Doubles" },
];

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
  quickGuestTarget,
  setQuickGuestTarget,
  creatingGuest,
  handleQuickGuest,
  quickGuestError,
  clearQuickGuestError,
  error,
  submitting,
  handleSubmit,
  onCancel,
}: MatchDetailsFormProps) {
  const locked = submitting || creatingGuest;
  const isSingles = matchType === "SINGLES";
  const selectedCourt = activeCourts.find((court) => String(court.id) === courtId);
  const slotLabel: Record<Exclude<QuickGuestTarget, null>, string> = {
    A1: "Team A · Player 1",
    A2: "Team A · Player 2",
    B1: "Team B · Player 1",
    B2: "Team B · Player 2",
  };

  const playerName = (id: string) => {
    if (!id) return "Choose player";
    const participant = availableForPicker(id).find((item) => String(item.id) === id);
    if (!participant) return "Selected player";
    return participant.nickname || formatFullName(participant.firstName, participant.lastName);
  };

  const beginGuest = (target: Exclude<QuickGuestTarget, null>) => {
    if (locked) return;
    setQuickGuestTarget(target);
    clearQuickGuestError();
    setShowQuickGuest(true);
  };

  const renderPlayerSlot = (
    target: Exclude<QuickGuestTarget, null>,
    playerId: string,
    setPlayerId: (value: string) => void,
  ) => (
    <div className="min-w-0 py-1">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Player {target[1]}
        </span>
        {playerId && (
          <button type="button" disabled={locked} onClick={() => setPlayerId("")}
            className="shrink-0 text-xs font-medium text-zinc-500 underline-offset-2 hover:underline disabled:opacity-50">
            Remove
          </button>
        )}
      </div>
      <div className="flex min-w-0 gap-2">
        <div className="min-w-0 flex-1">
          <ParticipantPicker
            participants={availableForPicker(playerId)}
            selectedParticipantId={playerId}
            onSelect={setPlayerId}
            disabled={locked}
            placeholder="Search players"
          />
        </div>
        <button type="button" disabled={locked} onClick={() => beginGuest(target)}
          aria-label={`Add Quick Guest to ${slotLabel[target]}`}
          className="shrink-0 rounded-lg border border-zinc-300 px-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
          + Guest
        </button>
      </div>
      {playerId && !availableForPicker(playerId).some((item) => String(item.id) === playerId) && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">This selection is unavailable. Choose another player.</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <section aria-labelledby="match-format-heading">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h4 id="match-format-heading" className="text-sm font-semibold">1. Match format</h4>
          <span className="text-xs text-zinc-500">Choose the game type</span>
        </div>
        <div role="group" aria-label="Match format" className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {formats.map((format) => {
            const selected = matchType === format.value;
            return (
              <button key={format.value} type="button" disabled={locked}
                aria-pressed={selected}
                onClick={() => {
                  setMatchType(format.value);
                  if (format.value === "SINGLES") {
                    setTeamAPlayer2("");
                    setTeamBPlayer2("");
                    setQuickGuestTarget((current) => current === "A2" || current === "B2" ? null : current);
                  }
                }}
                className={`min-h-11 min-w-0 rounded-lg border px-1.5 py-2 text-center text-xs font-semibold leading-tight transition-colors sm:px-3 sm:text-sm disabled:cursor-not-allowed disabled:opacity-60 ${selected ? "border-emerald-800 bg-emerald-900 text-white dark:border-emerald-300 dark:bg-emerald-950" : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"}`}>
                <span className="block break-words">{format.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="match-players-heading">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h4 id="match-players-heading" className="text-sm font-semibold">2. Players</h4>
          <span className="text-xs text-zinc-500">Selected players cannot be assigned twice</span>
        </div>
        <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
          <div className="min-w-0 border-l-2 border-emerald-800/20 pl-3 dark:border-lime-300/20">
            <h5 className="mb-1.5 text-sm font-semibold">Team A</h5>
            <div className="space-y-1">
              {renderPlayerSlot("A1", teamAPlayer1, setTeamAPlayer1)}
              {!isSingles && renderPlayerSlot("A2", teamAPlayer2, setTeamAPlayer2)}
            </div>
          </div>
          <div className="min-w-0 border-l-2 border-emerald-800/20 pl-3 dark:border-lime-300/20">
            <h5 className="mb-1.5 text-sm font-semibold">Team B</h5>
            <div className="space-y-1">
              {renderPlayerSlot("B1", teamBPlayer1, setTeamBPlayer1)}
              {!isSingles && renderPlayerSlot("B2", teamBPlayer2, setTeamBPlayer2)}
            </div>
          </div>
        </div>
        {showQuickGuest && (
          <div className="mt-3 rounded-xl border border-emerald-800/30 bg-emerald-50 p-3 dark:border-emerald-300/20 dark:bg-emerald-950/40">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-1">
              <p className="text-sm font-semibold">Quick Guest <span className="font-normal text-emerald-800 dark:text-emerald-200">{quickGuestTarget ? `for ${slotLabel[quickGuestTarget]}` : "Choose a player slot"}</span></p>
              <p className="text-xs text-zinc-500">Temporary session participant</p>
            </div>
            {quickGuestError && <p role="alert" className="mb-2 text-sm text-red-700 dark:text-red-300">{quickGuestError}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input ref={quickGuestInputRef} type="text" value={quickGuestName}
                onChange={(event) => setQuickGuestName(event.target.value)}
                disabled={locked} placeholder="Guest name or nickname"
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 disabled:opacity-60" />
              <button type="button" onClick={handleQuickGuest}
                disabled={!quickGuestName.trim() || !quickGuestTarget || locked}
                className="primary-action min-h-10 rounded-lg px-4 text-sm font-semibold disabled:opacity-50">
                {creatingGuest ? "Adding guest…" : "Add guest to slot"}
              </button>
              <button type="button" disabled={creatingGuest} onClick={() => {
                setShowQuickGuest(false);
                setQuickGuestTarget(null);
                setQuickGuestName("");
                clearQuickGuestError();
              }} className="min-h-10 rounded-lg border border-zinc-300 px-4 text-sm disabled:opacity-50 dark:border-zinc-700">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="match-court-heading">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h4 id="match-court-heading" className="text-sm font-semibold">3. Court and lights</h4>
          <span className="text-xs text-zinc-500">Set court and usage</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="min-w-0">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Court</span>
            <select value={courtId} disabled={locked} onChange={(event) => setCourtId(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-900 disabled:opacity-60">
              <option value="">{activeCourts.length === 0 ? "No active courts available" : "Select court"}</option>
              {activeCourts.map((court) => <option key={court.id} value={court.id}>{court.name} · {formatLabel(court.surface)} · {court.location}</option>)}
            </select>
          </label>
          <fieldset>
            <legend className="mb-1 text-xs font-medium text-zinc-500">Lights</legend>
            <div className="grid grid-cols-3 gap-2">
              {(["NONE", "HALF", "FULL"] as const).map((usage) => (
                <button key={usage} type="button" disabled={locked} aria-pressed={lightUsage === usage}
                  onClick={() => setLightUsage(usage)}
                  className={`min-h-11 rounded-lg px-2 text-sm font-medium disabled:opacity-50 ${lightUsage === usage ? "primary-action" : "secondary-action"}`}>
                  {usage === "NONE" ? "None" : usage === "HALF" ? "Half" : "Full"}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-zinc-500">Half applies 50% of the normal light fee.</p>
          </fieldset>
        </div>
      </section>

      <section aria-labelledby="match-review-heading" className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h4 id="match-review-heading" className="text-sm font-semibold">4. Review match</h4>
          {error && <span className="text-xs text-red-700 dark:text-red-300">Review the form error above</span>}
        </div>
        <div className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
          <p><span className="text-zinc-500">Format:</span> {formatLabel(matchType)}</p>
          <p className="truncate" title={selectedCourt?.name}><span className="text-zinc-500">Court:</span> {selectedCourt?.name || "Choose court"}</p>
          <p className="min-w-0 truncate" title={`${playerName(teamAPlayer1)}${!isSingles ? `, ${playerName(teamAPlayer2)}` : ""}`}><span className="text-zinc-500">Team A:</span> {playerName(teamAPlayer1)}{!isSingles ? ` · ${playerName(teamAPlayer2)}` : ""}</p>
          <p className="min-w-0 truncate" title={`${playerName(teamBPlayer1)}${!isSingles ? `, ${playerName(teamBPlayer2)}` : ""}`}><span className="text-zinc-500">Team B:</span> {playerName(teamBPlayer1)}{!isSingles ? ` · ${playerName(teamBPlayer2)}` : ""}</p>
          <p><span className="text-zinc-500">Lights:</span> {lightUsage === "NONE" ? "None" : lightUsage === "HALF" ? "Half" : "Full"}</p>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 pt-4 sm:flex-row sm:justify-end dark:border-zinc-800">
        <button type="button" disabled={locked} onClick={onCancel}
          className="min-h-11 rounded-lg border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
          Cancel
        </button>
        <button type="submit" disabled={submitting || creatingGuest || activeCourts.length === 0}
          className="primary-action min-h-11 rounded-lg px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
          {submitting ? "Creating match…" : editingMatch ? "Update match" : "Create match"}
        </button>
      </div>
    </form>
  );
}

export default MatchDetailsForm;
