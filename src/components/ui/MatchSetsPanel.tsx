import { useEffect, useState, type SubmitEvent } from "react";
import {
  addMatchSet,
  deleteMatchSet,
  getMatchSets,
  updateMatchSet,
} from "../../api/matchSets";
import type { Match, MatchStatus } from "../../types/match";
import type { MatchSet } from "../../types/matchSet";
import type { MatchParticipant } from "../../types/matchParticipant";
import { updateMatch } from "../../api/matches";
import { formatLabel } from "../../utils/format";

type MatchSetsPanelProps = {
  match: Match;
  matchNumber: number;
  courtLabel: string;
  participants: MatchParticipant[];
  canDelete: boolean;
  lockStatus: "checking" | "unknown" | "charged" | "unlocked";
  onSetsChanged: (matchId: number, sets: MatchSet[]) => void;
  onClose: () => void;
  onMatchUpdated: (updatedMatch: Match) => void;
};

function MatchSetsPanel({
  match,
  matchNumber,
  courtLabel,
  participants,
  canDelete,
  lockStatus,
  onSetsChanged,
  onClose,
  onMatchUpdated,
}: MatchSetsPanelProps) {
  const readOnly = lockStatus !== "unlocked";
  const [sets, setSets] = useState<MatchSet[]>([]);
  const [setNumber, setSetNumber] = useState("");
  const [teamAScore, setTeamAScore] = useState("");
  const [teamBScore, setTeamBScore] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingSetNumber, setDeletingSetNumber] = useState<number | null>(null);
  const [savingMatchAction, setSavingMatchAction] = useState<"result" | "status" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const calculatedResult = sets.length > 0 ? calculateResult(sets) : null;
  const [savedResult, setSavedResult] = useState<MatchStatus>(match.result);
  const [manualStatus, setManualStatus] = useState<MatchStatus>(match.result);
  const [editingSetNumber, setEditingSetNumber] = useState<number | null>(null);
  const latestSetNumber =
    sets.length > 0 ? Math.max(...sets.map((set) => set.setNumber)) : 0;
  const nextSetNumber = latestSetNumber + 1;

  useEffect(() => {
    let ignore = false;

    getMatchSets(match.id)
      .then((data) => {
        if (!ignore) {
          const orderedSets = [...data].sort((a, b) => a.setNumber - b.setNumber);
          setSets(orderedSets);
          onSetsChanged(match.id, orderedSets);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setLoadError("Failed to load sets");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [match.id, onSetsChanged]);

  async function loadSets() {
    const data = await getMatchSets(match.id);

    const orderedSets = [...data].sort((a, b) => a.setNumber - b.setNumber);
    setSets(orderedSets);
    onSetsChanged(match.id, orderedSets);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || savingMatchAction !== null || deletingSetNumber !== null || readOnly) return;

    if (teamAScore === "" || teamBScore === "") {
      setError("Enter a score for both teams.");
      return;
    }

    const parsedTeamAScore = Number(teamAScore);
    const parsedTeamBScore = Number(teamBScore);

    if (
      !Number.isInteger(parsedTeamAScore) ||
      !Number.isInteger(parsedTeamBScore) ||
      parsedTeamAScore < 0 ||
      parsedTeamBScore < 0
    ) {
      setError("Scores must be positive whole numbers or zero.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setFeedback(null);
      const savedSetNumber = editingSetNumber ?? nextSetNumber;

      if (editingSetNumber !== null) {
        await updateMatchSet(match.id, editingSetNumber, {
          setNumber: editingSetNumber,
          teamAScore: parsedTeamAScore,
          teamBScore: parsedTeamBScore,
        });
      } else {
        await addMatchSet(match.id, {
          setNumber: nextSetNumber,
          teamAScore: parsedTeamAScore,
          teamBScore: parsedTeamBScore,
        });
      }

      await loadSets();

      setEditingSetNumber(null);
      setSetNumber("");
      setTeamAScore("");
      setTeamBScore("");
      setFeedback(`Set ${savedSetNumber} saved.`);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to add set");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(setNumber: number) {
    if (readOnly || deletingSetNumber !== null || submitting || savingMatchAction !== null) return;
    const confirmed = window.confirm(`Delete Set ${setNumber}?`);

    if (!confirmed) {
      return;
    }

    try {
      setDeletingSetNumber(setNumber);
      setError(null);
      setFeedback(null);

      await deleteMatchSet(match.id, setNumber);
      if (editingSetNumber === setNumber) {
        setEditingSetNumber(null);
        setSetNumber("");
        setTeamAScore("");
        setTeamBScore("");
      }
      await loadSets();
      setFeedback(`Set ${setNumber} deleted.`);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete set");
      }
    } finally {
      setDeletingSetNumber(null);
    }
  }

  async function handleSaveResult() {
    if (readOnly || savingMatchAction !== null || submitting || deletingSetNumber !== null || sets.length === 0) return;
    try {
      setSavingMatchAction("result");
      setError(null);
      setFeedback(null);

      const result = calculateResult(sets);

      const updatedMatch = await updateMatch(match.id, {
        sessionId: match.sessionId,
        courtId: match.courtId,
        matchType: match.matchType,
        result,
        lightUsage: match.lightUsage,
      });

      setSavedResult(result);
      setManualStatus(result);

      onMatchUpdated(updatedMatch);
      setFeedback("Calculated result saved.");
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save match result");
      }
    } finally {
      setSavingMatchAction(null);
    }
  }

  async function handleSaveStatus() {
    if (readOnly || savingMatchAction !== null || submitting || deletingSetNumber !== null) return;
    try {
      setSavingMatchAction("status");
      setError(null);
      setFeedback(null);

      const updatedMatch = await updateMatch(match.id, {
        sessionId: match.sessionId,
        courtId: match.courtId,
        matchType: match.matchType,
        result: manualStatus,
        lightUsage: match.lightUsage,
      });

      setSavedResult(manualStatus);

      onMatchUpdated(updatedMatch);
      setFeedback("Match status saved.");
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save match status");
      }
    } finally {
      setSavingMatchAction(null);
    }
  }

  function handleEdit(set: MatchSet) {
    if (readOnly || submitting || deletingSetNumber !== null || savingMatchAction !== null) return;
    setFeedback(null);
    setError(null);
    setEditingSetNumber(set.setNumber);
    setSetNumber(String(set.setNumber));
    setTeamAScore(String(set.teamAScore));
    setTeamBScore(String(set.teamBScore));
  }

  function calculateResult(sets: MatchSet[]) {
    let teamAWins = 0;
    let teamBWins = 0;

    for (const set of sets) {
      if (set.teamAScore > set.teamBScore) {
        teamAWins++;
      }

      if (set.teamBScore > set.teamAScore) {
        teamBWins++;
      }
    }

    if (teamAWins > teamBWins) {
      return "TEAM_A_WIN";
    }

    if (teamBWins > teamAWins) {
      return "TEAM_B_WIN";
    }

    return "DRAW";
  }

  const teamA = participants.filter((participant) => participant.teamSide === "A");
  const teamB = participants.filter((participant) => participant.teamSide === "B");
  const expectedPlayers = match.matchType === "SINGLES" ? 1 : 2;
  const getTeamNames = (team: MatchParticipant[]) =>
    Array.from({ length: expectedPlayers }, (_, index) =>
      team[index]?.nickname?.trim() || "Awaiting player",
    );
  const teamANames = getTeamNames(teamA);
  const teamBNames = getTeamNames(teamB);
  const resultIsSaved = calculatedResult !== null && savedResult === calculatedResult;
  const statusIsSaved = savedResult === manualStatus;

  if (loading) {
    return (
      <div role="status" className="mt-5 rounded-2xl border border-stone-200 bg-[#F7F7F0] p-5 dark:border-stone-700 dark:bg-[#17221B]">
        <p className="text-sm font-medium text-stone-600 dark:text-stone-300">Loading scorecard…</p>
        <div className="mt-3 h-2 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
        <p className="text-sm text-red-800 dark:text-red-200">{loadError}</p>
        <button type="button" onClick={onClose} className="secondary-action mt-3 min-h-10 rounded-lg px-3 py-2 text-sm">
          Return to match board
        </button>
      </div>
    );
  }

  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-stone-200 bg-[#F7F7F0] text-stone-900 dark:border-stone-700 dark:bg-[#111C15] dark:text-stone-100" aria-label={`Scorecard for Match ${matchNumber}`}>
      <header className="bg-[#14251B] px-4 py-3.5 text-white sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D8C86E]">Match scorecard</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight sm:text-xl">Match #{matchNumber}</h3>
            <p className="mt-1 break-words text-sm text-white/75">{courtLabel}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">{formatLabel(match.matchType)}</span>
              {match.lightUsage !== "NONE" && (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">
                  {match.lightUsage === "HALF" ? "Half lights" : "Full lights"}
                </span>
              )}
              <span className="rounded-full border border-[#D8C86E]/50 bg-[#D8C86E]/10 px-2.5 py-1 text-xs font-semibold text-[#E7D98C]">
                {formatLabel(savedResult)}
              </span>
              {lockStatus === "charged" && (
                <span className="rounded-full bg-[#D8C86E] px-2.5 py-1 text-xs font-bold text-[#1B281E]">Locked · Charged</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-3 sm:p-4">
        {readOnly && (
          <div role="status" className="rounded-xl border border-[#D8C86E]/70 bg-[#FAF7E9] px-3.5 py-3 text-sm text-[#554F32] dark:border-[#766D3C] dark:bg-[#292719] dark:text-[#E5DAA5]">
            <p className="font-semibold">{lockStatus === "charged" ? "This match is locked" : lockStatus === "checking" ? "Checking charge lock" : "Charge status unavailable"}</p>
            <p className="mt-0.5 text-xs leading-5">
              {lockStatus === "charged" ? "Charges have been generated. The saved score and result are available to view; match changes are disabled." : lockStatus === "checking" ? "Editing is paused until the charge status has been verified." : "Editing is unavailable until the charge status can be verified."}
            </p>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}
        {feedback && !error && (
          <p aria-live="polite" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            {feedback}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {([
            ["A", teamANames],
            ["B", teamBNames],
          ] as const).map(([side, names]) => (
            <div key={side} className="min-w-0 rounded-xl border border-stone-200 bg-white px-3 py-3 dark:border-stone-700 dark:bg-[#1B2820] sm:px-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">Team {side}</p>
              <div className="mt-2 space-y-1.5">
                {names.map((name, index) => (
                  <p key={`${side}-${index}`} className={`break-words text-sm leading-5 sm:text-base ${name === "Awaiting player" ? "text-stone-400 dark:text-stone-500" : "font-semibold text-stone-900 dark:text-white"}`}>
                    {name}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!readOnly && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-[#D8C86E] bg-[#FBF8E9] p-3.5 dark:border-[#766D3C] dark:bg-[#242318] sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#736A3E] dark:text-[#D8C86E]">{editingSetNumber === null ? "Current set" : "Editing saved set"}</p>
                <h4 className="mt-0.5 text-base font-bold text-stone-900 dark:text-white">
                  Set {editingSetNumber !== null ? setNumber : nextSetNumber}
                </h4>
              </div>
              {editingSetNumber !== null && <span className="rounded-full bg-[#D8C86E] px-2.5 py-1 text-xs font-bold text-[#1B281E]">Edit mode</span>}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
              {([
                ["A", teamANames, teamAScore, setTeamAScore],
                ["B", teamBNames, teamBScore, setTeamBScore],
              ] as const).map(([side, names, score, setScore]) => (
                <label key={side} className="min-w-0">
                  <span className="block text-xs font-bold text-stone-700 dark:text-stone-200">Team {side}</span>
                  <span className="mt-0.5 block min-h-8 break-words text-[11px] leading-4 text-stone-500 dark:text-stone-400">{names.join(" · ")}</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    aria-label={`Team ${side} score`}
                    placeholder="0"
                    value={score}
                    required
                    disabled={submitting || savingMatchAction !== null || deletingSetNumber !== null}
                    onChange={(event) => { setFeedback(null); setScore(event.target.value); }}
                    className="mt-1 h-14 w-full rounded-xl border border-stone-300 bg-white px-3 text-center font-mono text-2xl font-bold tabular-nums text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 disabled:opacity-60 dark:border-stone-600 dark:bg-[#111C15] dark:text-white dark:focus:border-lime-300"
                  />
                </label>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={submitting || savingMatchAction !== null || deletingSetNumber !== null}
                className="min-h-12 flex-1 rounded-xl bg-[#183E2A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#215437] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-lime-300 dark:text-[#15251A] dark:hover:bg-lime-200"
              >
                {submitting ? "Saving set…" : editingSetNumber !== null ? "Save set changes" : "Save set"}
              </button>
              {editingSetNumber !== null && (
                <button
                  type="button"
                  disabled={submitting || deletingSetNumber !== null}
                  onClick={() => {
                    setEditingSetNumber(null);
                    setSetNumber("");
                    setTeamAScore("");
                    setTeamBScore("");
                    setFeedback(null);
                  }}
                  className="secondary-action min-h-12 rounded-xl px-4 py-3 text-sm font-medium"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        )}

        <section aria-labelledby="saved-sets-heading">
          <div className="flex items-center justify-between gap-2">
            <h4 id="saved-sets-heading" className="text-sm font-bold text-stone-800 dark:text-stone-100">Saved sets</h4>
            <span className="text-xs text-stone-500 dark:text-stone-400">{sets.length} {sets.length === 1 ? "set" : "sets"}</span>
          </div>
          {sets.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-stone-300 bg-white/70 px-3 py-4 text-sm text-stone-500 dark:border-stone-700 dark:bg-white/5 dark:text-stone-400">
              {readOnly ? "No set scores were recorded." : "No sets saved yet. Enter both scores above, then save the set."}
            </p>
          ) : (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {sets.map((set) => {
                const isEditing = editingSetNumber === set.setNumber;
                const isLatest = set.setNumber === latestSetNumber;
                return (
                  <div key={set.setNumber} className={`flex min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${isEditing ? "border-emerald-700 bg-emerald-50 ring-2 ring-emerald-700/10 dark:border-lime-300 dark:bg-emerald-950/50" : "border-stone-200 bg-white dark:border-stone-700 dark:bg-[#1B2820]"}`}>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-stone-500 dark:text-stone-400">Set {set.setNumber}{isEditing ? " · Editing" : ""}</p>
                      <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 font-mono text-lg font-bold tabular-nums text-stone-950 dark:text-white">
                        <span className="text-[10px] font-semibold text-stone-500">A</span>{set.teamAScore}
                        <span className="text-sm text-stone-400">–</span>
                        <span className="text-[10px] font-semibold text-stone-500">B</span>{set.teamBScore}
                      </p>
                    </div>
                    {!readOnly && (
                      <div className="flex shrink-0 gap-1.5">
                        <button type="button" disabled={submitting || deletingSetNumber !== null || savingMatchAction !== null} onClick={() => handleEdit(set)} className="secondary-action min-h-10 rounded-lg px-3 py-2 text-xs font-semibold">Edit</button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => { void handleDelete(set.setNumber); }}
                            disabled={!isLatest || submitting || deletingSetNumber !== null || savingMatchAction !== null}
                            title={!isLatest ? "Only the newest set can be deleted" : undefined}
                            className="min-h-10 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-red-900/70 dark:text-red-300 dark:hover:bg-red-950/40"
                          >
                            {deletingSetNumber === set.setNumber ? "Deleting…" : "Delete"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid gap-4 border-t border-stone-200 pt-4 dark:border-stone-700 md:grid-cols-2">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-stone-800 dark:text-stone-100">Score result</h4>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-200">Saved: {formatLabel(savedResult)}</span>
            </div>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
              {calculatedResult ? `From saved sets: ${formatLabel(calculatedResult)}` : "No score-derived result yet"}
            </p>
            {readOnly ? (
              <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">Saved result is locked with the charged match.</p>
            ) : resultIsSaved ? (
              <p className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">Score-derived result is saved.</p>
            ) : calculatedResult && (
              <button
                type="button"
                onClick={() => { void handleSaveResult(); }}
                disabled={savingMatchAction !== null || submitting || deletingSetNumber !== null}
                className="mt-3 min-h-11 w-full rounded-xl bg-[#183E2A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#215437] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-lime-300 dark:text-[#15251A] dark:hover:bg-lime-200"
              >
                {savingMatchAction === "result" ? "Saving result…" : "Save calculated result"}
              </button>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-stone-800 dark:text-stone-100">Match status</h4>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-200">{formatLabel(savedResult)}</span>
            </div>
            {readOnly ? (
              <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-stone-400">This status is locked because charges have been generated.</p>
            ) : (
              <>
                <label htmlFor={`match-status-${match.id}`} className="mt-3 block text-xs font-semibold text-stone-600 dark:text-stone-300">Choose a status or outcome</label>
                <select
                  id={`match-status-${match.id}`}
                  value={manualStatus}
                  disabled={savingMatchAction !== null || submitting || deletingSetNumber !== null}
                  onChange={(event) => { setFeedback(null); setManualStatus(event.target.value as MatchStatus); }}
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 disabled:opacity-60 dark:border-stone-600 dark:bg-[#111C15] dark:text-white dark:focus:border-lime-300"
                >
                  <optgroup label="Play">
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="IN_PROGRESS">In Progress</option>
                  </optgroup>
                  <optgroup label="Match result">
                    <option value="TEAM_A_WIN">Team A Win</option>
                    <option value="TEAM_B_WIN">Team B Win</option>
                    <option value="DRAW">Draw</option>
                  </optgroup>
                  <optgroup label="Exceptional outcomes">
                    <option value="WALKOVER_A">Team A Walkover</option>
                    <option value="WALKOVER_B">Team B Walkover</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="POSTPONED">Postponed</option>
                    <option value="ABANDONED">Abandoned</option>
                  </optgroup>
                </select>
                {statusIsSaved ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">Current status is saved.</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => { void handleSaveStatus(); }}
                    disabled={savingMatchAction !== null || submitting || deletingSetNumber !== null}
                    className="secondary-action mt-3 min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingMatchAction === "status" ? "Saving status…" : "Save status"}
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

export default MatchSetsPanel;
