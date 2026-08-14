import { useEffect, useState, type SubmitEvent } from "react";
import {
  addMatchSet,
  deleteMatchSet,
  getMatchSets,
  updateMatchSet,
} from "../../api/matchSets";
import type { Match, MatchStatus } from "../../types/match";
import type { MatchSet } from "../../types/matchSet";
import { updateMatch } from "../../api/matches";

type MatchSetsPanelProps = {
  match: Match;
  onClose: () => void;
  onMatchUpdated: (updatedMatch: Match) => void;
};

function MatchSetsPanel({
  match,
  onClose,
  onMatchUpdated,
}: MatchSetsPanelProps) {
  const [sets, setSets] = useState<MatchSet[]>([]);
  const [setNumber, setSetNumber] = useState("");
  const [teamAScore, setTeamAScore] = useState("");
  const [teamBScore, setTeamBScore] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const calculatedResult = sets.length > 0 ? calculateResult(sets) : null;
  const [savedResult, setSavedResult] = useState<MatchStatus>(match.result);
  const [manualStatus, setManualStatus] = useState<MatchStatus>(match.result);
  const [editingSetNumber, setEditingSetNumber] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;

    getMatchSets(match.id)
      .then((data) => {
        if (!ignore) {
          setSets(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError("Failed to load sets");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [match.id]);

  async function loadSets() {
    const data = await getMatchSets(match.id);
    setSets(data);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      if (editingSetNumber !== null) {
        await updateMatchSet(match.id, editingSetNumber, {
          setNumber: editingSetNumber,
          teamAScore: Number(teamAScore),
          teamBScore: Number(teamBScore),
        });
      } else {
        await addMatchSet(match.id, {
          setNumber: Number(setNumber),
          teamAScore: Number(teamAScore),
          teamBScore: Number(teamBScore),
        });
      }

      await loadSets();

      setSetNumber("");
      setTeamAScore("");
      setTeamBScore("");
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
    const confirmed = window.confirm(`Delete Set ${setNumber}?`);

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await deleteMatchSet(match.id, setNumber);

      await loadSets();
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete set");
      }
    }
  }

  async function handleSaveResult() {
    try {
      setError(null);

      const result = calculateResult(sets);

      const updatedMatch = await updateMatch(match.id, {
        sessionId: match.sessionId,
        courtId: match.courtId,
        matchType: match.matchType,
        result,
        lightsOn: match.lightsOn,
      });

      setSavedResult(result);
      setManualStatus(result);

      onMatchUpdated(updatedMatch);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save match result");
      }
    }
  }

  async function handleSaveStatus() {
    try {
      setError(null);

      const updatedMatch = await updateMatch(match.id, {
        sessionId: match.sessionId,
        courtId: match.courtId,
        matchType: match.matchType,
        result: manualStatus,
        lightsOn: match.lightsOn,
      });

      setSavedResult(manualStatus);

      onMatchUpdated(updatedMatch);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save match status");
      }
    }
  }

  function handleEdit(set: MatchSet) {
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

  if (loading) {
    return <p>Loading sets...</p>;
  }

  return (
    <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Match Score</p>

          <h3 className="font-semibold">Match #{match.id}</h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-sm text-zinc-400 hover:text-white"
        >
          Close
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-5 flex flex-wrap gap-2">
        <input
          type="number"
          min="1"
          placeholder="Set #"
          value={setNumber}
          onChange={(event) => setSetNumber(event.target.value)}
          className="w-24 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
        />

        <input
          type="number"
          min="0"
          placeholder="Team A"
          value={teamAScore}
          onChange={(event) => setTeamAScore(event.target.value)}
          className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
        />

        <input
          type="number"
          min="0"
          placeholder="Team B"
          value={teamBScore}
          onChange={(event) => setTeamBScore(event.target.value)}
          className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
        />

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {submitting
            ? "Saving..."
            : editingSetNumber !== null
              ? "Update Set"
              : "Add Set"}
        </button>
        {editingSetNumber !== null && (
          <button
            type="button"
            onClick={() => {
              setEditingSetNumber(null);
              setSetNumber("");
              setTeamAScore("");
              setTeamBScore("");
            }}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm"
          >
            Cancel Edit
          </button>
        )}
      </form>

      <div className="mt-5 space-y-2">
        {sets.length === 0 ? (
          <p className="text-sm text-zinc-500">No sets recorded yet.</p>
        ) : (
          sets.map((set) => (
            <div
              key={set.setNumber}
              className="flex items-center justify-between rounded-lg bg-zinc-900 px-3 py-2"
            >
              <span>
                Set {set.setNumber}: {set.teamAScore}–{set.teamBScore}
              </span>
              <button
                type="button"
                onClick={() => handleEdit(set)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => handleDelete(set.setNumber)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
      {calculatedResult && (
        <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Calculated Result</p>

          <p className="mt-1 font-semibold">
            {calculatedResult === "TEAM_A_WIN"
              ? "Team A Win"
              : calculatedResult === "TEAM_B_WIN"
                ? "Team B Win"
                : "Draw"}
          </p>

          {savedResult === calculatedResult ? (
            <p className="mt-3 text-sm text-green-400">Result saved</p>
          ) : (
            <button
              type="button"
              onClick={handleSaveResult}
              className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
            >
              Save Result
            </button>
          )}
        </div>
      )}
      <div className="mt-5">
        <label className="text-sm text-zinc-400">Match Status</label>

        <select
          value={manualStatus}
          onChange={(event) =>
            setManualStatus(event.target.value as MatchStatus)
          }
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
        >
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="TEAM_A_WIN">Team A Win</option>
          <option value="TEAM_B_WIN">Team B Win</option>
          <option value="DRAW">Draw</option>
          <option value="WALKOVER_A">Team A Walkover</option>
          <option value="WALKOVER_B">Team B Walkover</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="POSTPONED">Postponed</option>
          <option value="ABANDONED">Abandoned</option>
        </select>
      </div>
      {savedResult === manualStatus ? (
        <p className="mt-3 text-sm text-green-400">Status saved</p>
      ) : (
        <button
          type="button"
          onClick={handleSaveStatus}
          className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
        >
          Save Status
        </button>
      )}
    </div>
  );
}

export default MatchSetsPanel;
