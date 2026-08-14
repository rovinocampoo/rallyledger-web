import { useEffect, useState, type SubmitEvent } from "react";
import { createMatch, deleteMatch, getSessionMatches } from "../../api/matches";
import { getCourts } from "../../api/courts";
import type { Session } from "../../types/session";
import type { Match } from "../../types/match";
import type { Court } from "../../types/court";
import MatchParticipantsPanel from "./MatchParticipantsPanel";
import MatchSetsPanel from "./MatchSetsPanel";
import { formatLabel } from "../../utils/format";
import { generateMatchCharges, getMatchCharges } from "../../api/charges";
import MatchChargesPanel from "./MatchChargesPanel";

type SessionMatchesPanelProps = {
  session: Session;
  onClose: () => void;
};

function SessionMatchesPanel({ session, onClose }: SessionMatchesPanelProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [courtId, setCourtId] = useState("");
  const [matchType, setMatchType] = useState("DOUBLES");
  const [lightsOn, setLightsOn] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scoreMatch, setScoreMatch] = useState<Match | null>(null);
  const [chargeMatch, setChargeMatch] = useState<Match | null>(null);
  const [chargedMatchIds, setChargedMatchIds] = useState<number[]>([]);

  useEffect(() => {
    let ignore = false;

    Promise.all([getSessionMatches(session.id), getCourts()]).then(
      async ([matchData, courtData]) => {
        const chargeResults = await Promise.all(
          matchData.map(async (match) => {
            const charges = await getMatchCharges(match.id);

            return {
              matchId: match.id,
              hasCharges: charges.length > 0,
            };
          }),
        );

        if (!ignore) {
          setMatches(matchData);
          setCourts(courtData);

          setChargedMatchIds(
            chargeResults
              .filter((result) => result.hasCharges)
              .map((result) => result.matchId),
          );

          setLoading(false);
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, [session.id]);

  async function loadMatches() {
    const data = await getSessionMatches(session.id);
    setMatches(data);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!courtId) {
      setError("Please select a court");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await createMatch({
        sessionId: session.id,
        courtId: Number(courtId),
        matchType,
        lightsOn,
      });

      await loadMatches();

      setCourtId("");
      setMatchType("DOUBLES");
      setLightsOn(false);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError("Failed to create match");
    } finally {
      setSubmitting(false);
    }
  }

  function handleMatchUpdated(updatedMatch: Match) {
    setMatches((current) =>
      current.map((match) =>
        match.id === updatedMatch.id ? updatedMatch : match,
      ),
    );

    setScoreMatch((current) =>
      current?.id === updatedMatch.id ? updatedMatch : current,
    );
  }

  async function handleDeleteMatch(match: Match) {
    const confirmed = window.confirm(`Delete Match #${match.id}?`);

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await deleteMatch(match.id);
      await loadMatches();
    } catch (err) {
      console.error(err);
      setError("Failed to delete match");
    }
  }

  async function handleGenerateCharges(match: Match) {
    const confirmed = window.confirm(
      `Generate charges for Match #${match.id}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await generateMatchCharges(match.id);

      setChargedMatchIds((current) => [...current, match.id]);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to generate charges");
      }
    }
  }

  if (loading) {
    return <p>Loading matches...</p>;
  }

  return (
    <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-400">Session Matches</p>

          <h2 className="text-xl font-semibold">{session.name}</h2>

          <p className="mt-1 text-sm text-zinc-500">{matches.length} matches</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black"
          >
            Add Match
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950 p-4"
        >
          <h3 className="mb-4 font-semibold">Create Match</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm text-zinc-400">Court</span>

              <select
                value={courtId}
                onChange={(event) => setCourtId(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
              >
                <option value="">Select court</option>

                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm text-zinc-400">Match Type</span>

              <select
                value={matchType}
                onChange={(event) => setMatchType(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
              >
                <option value="SINGLES">Singles</option>

                <option value="DOUBLES">Doubles</option>

                <option value="MIXED_DOUBLES">Mixed Doubles</option>
              </select>
            </label>
          </div>

          <label className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={lightsOn}
              onChange={(event) => setLightsOn(event.target.checked)}
            />

            <span className="text-sm">Lights On</span>
          </label>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Match"}
            </button>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {selectedMatch && (
        <MatchParticipantsPanel
          key={selectedMatch.id}
          match={selectedMatch}
          session={session}
          onClose={() => setSelectedMatch(null)}
        />
      )}
      {scoreMatch && (
        <MatchSetsPanel
          key={scoreMatch.id}
          match={scoreMatch}
          onClose={() => setScoreMatch(null)}
          onMatchUpdated={handleMatchUpdated}
        />
      )}
      {chargeMatch && (
        <MatchChargesPanel
          key={chargeMatch.id}
          match={chargeMatch}
          onClose={() => setChargeMatch(null)}
        />
      )}

      <div className="mt-6 space-y-2">
        {matches.length === 0 ? (
          <p className="text-sm text-zinc-500">No matches yet.</p>
        ) : (
          matches.map((match) => {
            const court = courts.find((court) => court.id === match.courtId);
            const hasCharges = chargedMatchIds.includes(match.id);
            const canGenerateCharges = [
              "TEAM_A_WIN",
              "TEAM_B_WIN",
              "DRAW",
              "WALKOVER_A",
              "WALKOVER_B",
              "ABANDONED",
            ].includes(match.result);

            return (
              <div key={match.id} className="rounded-lg bg-zinc-950 px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">Match #{match.id}</p>
                    <p className="font-medium">
                      {`Status: ${formatLabel(match.result)}`}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {court?.name ?? `Court ${match.courtId}`}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-zinc-800 px-2.5 py-1">
                        {match.matchType}
                      </span>

                      {match.lightsOn && (
                        <span className="rounded-full bg-zinc-800 px-2.5 py-1">
                          Lights On
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteMatch(match)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateCharges(match)}
                    disabled={!canGenerateCharges || hasCharges}
                    className="text-sm text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {hasCharges ? "Charges Generated" : "Generate Charges"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChargeMatch(match)}
                    disabled={!hasCharges}
                    className="text-sm text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    View Charges
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMatch(match)}
                  disabled={hasCharges}
                  className="text-sm text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Manage Players
                </button>
                <button
                  type="button"
                  onClick={() => setScoreMatch(match)}
                  disabled={hasCharges}
                 className="text-sm text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Manage Score
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SessionMatchesPanel;
