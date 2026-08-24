import { useEffect, useState, type SubmitEvent } from "react";
import {
  createMatch,
  deleteMatch,
  getSessionMatches,
  updateMatch,
} from "../../api/matches";
import { getCourts } from "../../api/courts";
import type { Session } from "../../types/session";
import type { Match } from "../../types/match";
import type { Court } from "../../types/court";
import MatchSetsPanel from "./MatchSetsPanel";
import { formatLabel } from "../../utils/format";
import { generateMatchCharges, getMatchCharges } from "../../api/charges";
import MatchChargesPanel from "./MatchChargesPanel";
import {
  addMatchParticipant,
  getMatchParticipants,
  removeMatchParticipant,
} from "../../api/matchParticipants";
import type { MatchParticipant } from "../../types/matchParticipant";
import { createParticipant, getParticipants } from "../../api/participants";
import type { Participant } from "../../types/participant";
import {
  addSessionParticipant,
  getSessionParticipants,
} from "../../api/sessionParticipants";
import ParticipantPicker from "../ui/ParticipantPicker";

type SessionMatchesPanelProps = {
  session: Session;
  onClose: () => void;
};

function SessionMatchesPanel({ session, onClose }: SessionMatchesPanelProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const activeCourts = courts.filter((court) => court.isActive);
  const [showForm, setShowForm] = useState(false);
  const [courtId, setCourtId] = useState("");
  const [matchType, setMatchType] = useState("DOUBLES");
  const [lightsOn, setLightsOn] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manageTab, setManageTab] = useState<"MATCH" | "SCORE">("MATCH");
  const [chargeMatch, setChargeMatch] = useState<Match | null>(null);
  const [chargedMatchIds, setChargedMatchIds] = useState<number[]>([]);
  const [participantsByMatch, setParticipantsByMatch] = useState<
    Record<number, MatchParticipant[]>
  >({});

  const [teamAPlayer1, setTeamAPlayer1] = useState("");
  const [teamAPlayer2, setTeamAPlayer2] = useState("");
  const [teamBPlayer1, setTeamBPlayer1] = useState("");
  const [teamBPlayer2, setTeamBPlayer2] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [showQuickGuest, setShowQuickGuest] = useState(false);
  const [quickGuestName, setQuickGuestName] = useState("");
  const [quickGuestTarget, setQuickGuestTarget] = useState<
    "A1" | "A2" | "B1" | "B2" | null
  >(null);
  const [creatingGuest, setCreatingGuest] = useState(false);
  const [sessionParticipantIds, setSessionParticipantIds] = useState<number[]>(
    [],
  );

  useEffect(() => {
    let ignore = false;

    Promise.all([
      getSessionMatches(session.id),
      getCourts(),
      getParticipants(),
      getSessionParticipants(session.id),
    ]).then(
      async ([
        matchData,
        courtData,
        participantData,
        sessionParticipantData,
      ]) => {
        const chargeResults = await Promise.all(
          matchData.map(async (match) => {
            const charges = await getMatchCharges(match.id);

            return {
              matchId: match.id,
              hasCharges: charges.length > 0,
            };
          }),
        );

        const participantResults = await Promise.all(
          matchData.map(async (match) => {
            const participants = await getMatchParticipants(match.id);

            return {
              matchId: match.id,
              participants,
            };
          }),
        );

        if (!ignore) {
          setParticipants(participantData);
          setMatches(matchData);
          setCourts(courtData);
          setSessionParticipantIds(
            sessionParticipantData.map(
              (sessionParticipant) => sessionParticipant.participantId,
            ),
          );

          setChargedMatchIds(
            chargeResults
              .filter((result) => result.hasCharges)
              .map((result) => result.matchId),
          );
          const groupedParticipants: Record<number, MatchParticipant[]> = {};

          participantResults.forEach((result) => {
            groupedParticipants[result.matchId] = result.participants;
          });

          setParticipantsByMatch(groupedParticipants);
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
    await loadMatchParticipants(data);
  }

  async function loadMatchParticipants(matchList: Match[]) {
    const results = await Promise.all(
      matchList.map(async (match) => {
        const participants = await getMatchParticipants(match.id);

        return {
          matchId: match.id,
          participants,
        };
      }),
    );

    const grouped: Record<number, MatchParticipant[]> = {};

    results.forEach((result) => {
      grouped[result.matchId] = result.participants;
    });

    setParticipantsByMatch(grouped);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!courtId) {
      setError("Please select a court");
      return;
    }

    if (!teamAPlayer1 || !teamBPlayer1) {
      setError("Please select players for both teams");
      return;
    }

    if (matchType !== "SINGLES" && (!teamAPlayer2 || !teamBPlayer2)) {
      setError("Please select 2 players for each team");
      return;
    }

    const selectedPlayerIds = [
      teamAPlayer1,
      teamBPlayer1,
      ...(matchType !== "SINGLES" ? [teamAPlayer2, teamBPlayer2] : []),
    ];

    if (new Set(selectedPlayerIds).size !== selectedPlayerIds.length) {
      setError("A player cannot be selected more than once");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);

      if (editingMatch) {
        const updatedMatch = await updateMatch(editingMatch.id, {
          sessionId: session.id,
          courtId: Number(courtId),
          matchType,
          result: editingMatch.result,
          lightsOn,
        });

        const teamAIds = [
          Number(teamAPlayer1),
          ...(matchType !== "SINGLES" ? [Number(teamAPlayer2)] : []),
        ];

        const teamBIds = [
          Number(teamBPlayer1),
          ...(matchType !== "SINGLES" ? [Number(teamBPlayer2)] : []),
        ];

        const desiredAssignments = [
          ...teamAIds.map((participantId) => ({
            participantId,
            teamSide: "A",
          })),
          ...teamBIds.map((participantId) => ({
            participantId,
            teamSide: "B",
          })),
        ];

        // Make sure newly selected players also belong to the session.
        const sessionParticipants = await getSessionParticipants(session.id);

        const existingSessionParticipantIds = new Set(
          sessionParticipants.map(
            (sessionParticipant) => sessionParticipant.participantId,
          ),
        );

        for (const assignment of desiredAssignments) {
          if (!existingSessionParticipantIds.has(assignment.participantId)) {
            await addSessionParticipant(session.id, assignment.participantId);
          }
        }

        const existingMatchParticipants =
          participantsByMatch[editingMatch.id] ?? [];

        const desiredParticipantIds = new Set(
          desiredAssignments.map((assignment) => assignment.participantId),
        );

        // First remove:
        // 1. players no longer selected
        // 2. players who are changing teams
        //
        // This frees team capacity before re-adding swapped players.
        for (const existing of existingMatchParticipants) {
          const desiredAssignment = desiredAssignments.find(
            (assignment) => assignment.participantId === existing.participantId,
          );

          const noLongerSelected = !desiredParticipantIds.has(
            existing.participantId,
          );

          const changingTeam =
            desiredAssignment &&
            desiredAssignment.teamSide !== existing.teamSide;

          if (noLongerSelected || changingTeam) {
            await removeMatchParticipant(
              editingMatch.id,
              existing.participantId,
            );
          }
        }

        // Then add:
        // 1. brand-new players
        // 2. players we just removed because they changed teams
        for (const assignment of desiredAssignments) {
          const existing = existingMatchParticipants.find(
            (participant) =>
              participant.participantId === assignment.participantId,
          );

          const unchanged =
            existing && existing.teamSide === assignment.teamSide;

          if (unchanged) {
            continue;
          }

          await addMatchParticipant(
            editingMatch.id,
            assignment.participantId,
            assignment.teamSide,
          );
        }

        setMatches((current) =>
          current.map((match) =>
            match.id === updatedMatch.id ? updatedMatch : match,
          ),
        );
      } else {
        const newMatch = await createMatch({
          sessionId: session.id,
          courtId: Number(courtId),
          matchType,
          lightsOn,
        });

        const teamAIds = [
          Number(teamAPlayer1),
          ...(matchType !== "SINGLES" ? [Number(teamAPlayer2)] : []),
        ];

        const teamBIds = [
          Number(teamBPlayer1),
          ...(matchType !== "SINGLES" ? [Number(teamBPlayer2)] : []),
        ];

        const selectedParticipantIds = [...teamAIds, ...teamBIds];

        const sessionParticipants = await getSessionParticipants(session.id);

        const existingSessionParticipantIds = new Set(
          sessionParticipants.map(
            (sessionParticipant) => sessionParticipant.participantId,
          ),
        );

        for (const participantId of selectedParticipantIds) {
          if (!existingSessionParticipantIds.has(participantId)) {
            await addSessionParticipant(session.id, participantId);
          }
        }

        for (const participantId of teamAIds) {
          await addMatchParticipant(newMatch.id, participantId, "A");
        }

        for (const participantId of teamBIds) {
          await addMatchParticipant(newMatch.id, participantId, "B");
        }
      }

      await loadMatches();

      setCourtId("");
      setMatchType("DOUBLES");
      setLightsOn(false);

      setTeamAPlayer1("");
      setTeamAPlayer2("");
      setTeamBPlayer1("");
      setTeamBPlayer2("");

      setEditingMatch(null);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError(
        editingMatch ? "Failed to update match" : "Failed to create match",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQuickGuest() {
    const name = quickGuestName.trim();

    if (!name || !quickGuestTarget) {
      return;
    }

    try {
      setCreatingGuest(true);
      setError(null);

      const guest = await createParticipant({
        firstName: name,
        lastName: "Guest",
        nickname: name,
        birthday: "1970-01-01T00:00:00Z",
        membershipStatus: "ACTIVE",
        participantType: "NONMEMBER",
        isTemporary: true,
      });

      await addSessionParticipant(session.id, guest.id);

      setSessionParticipantIds((current) => [...current, guest.id]);
      setParticipants((current) => [...current, guest]);

      const guestId = String(guest.id);

      if (quickGuestTarget === "A1") {
        setTeamAPlayer1(guestId);
      }

      if (quickGuestTarget === "A2") {
        setTeamAPlayer2(guestId);
      }

      if (quickGuestTarget === "B1") {
        setTeamBPlayer1(guestId);
      }

      if (quickGuestTarget === "B2") {
        setTeamBPlayer2(guestId);
      }

      setQuickGuestName("");
      setQuickGuestTarget(null);
      setShowQuickGuest(false);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to create quick guest",
      );
    } finally {
      setCreatingGuest(false);
    }
  }

  function handleEditMatch(match: Match) {
    const matchParticipants = participantsByMatch[match.id] ?? [];

    const teamA = matchParticipants.filter(
      (participant) => participant.teamSide === "A",
    );

    const teamB = matchParticipants.filter(
      (participant) => participant.teamSide === "B",
    );

    setEditingMatch(match);

    setCourtId(String(match.courtId));
    setMatchType(match.matchType);
    setLightsOn(match.lightsOn);

    setTeamAPlayer1(teamA[0] ? String(teamA[0].participantId) : "");

    setTeamAPlayer2(teamA[1] ? String(teamA[1].participantId) : "");

    setTeamBPlayer1(teamB[0] ? String(teamB[0].participantId) : "");

    setTeamBPlayer2(teamB[1] ? String(teamB[1].participantId) : "");

    setManageTab("MATCH");
    setChargeMatch(null);

    setShowForm(true);
    setError(null);
  }

  function handleMatchUpdated(updatedMatch: Match) {
    setMatches((current) =>
      current.map((match) =>
        match.id === updatedMatch.id ? updatedMatch : match,
      ),
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

  function availableForPicker(currentValue: string) {
    const selectedIds = [
      teamAPlayer1,
      teamAPlayer2,
      teamBPlayer1,
      teamBPlayer2,
    ].filter((id) => id && id !== currentValue);

    return participants.filter((participant) => {
      const alreadySelected = selectedIds.includes(String(participant.id));

      if (alreadySelected) {
        return false;
      }

      if (!participant.isTemporary) {
        return true;
      }

      return sessionParticipantIds.includes(participant.id);
    });
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

      {showForm && (
        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <h3 className="mb-6 text-lg font-semibold text-left">
            {editingMatch ? "Manage Match" : "Create Match"}
          </h3>
          {editingMatch && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setManageTab("MATCH")}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  manageTab === "MATCH"
                    ? "bg-white text-black"
                    : "border border-zinc-700 text-zinc-300"
                }`}
              >
                Details & Players
              </button>

              <button
                type="button"
                onClick={() => setManageTab("SCORE")}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  manageTab === "SCORE"
                    ? "bg-white text-black"
                    : "border border-zinc-700 text-zinc-300"
                }`}
              >
                Score
              </button>
            </div>
          )}
          {(!editingMatch || manageTab === "MATCH") && (
            <form onSubmit={handleSubmit}>
              <>
                <div className="grid gap-4 md:grid-cols-2 text-left">
                  <label>
                    <span className="text-sm text-zinc-400">Court</span>

                    <select
                      value={courtId}
                      onChange={(event) => setCourtId(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
                    >
                      <option value="">
                        {activeCourts.length === 0
                          ? "No active courts available"
                          : "Select court"}
                      </option>
                      {activeCourts.map((court) => (
                        <option key={court.id} value={court.id}>
                          {court.name} - {formatLabel(court.surface)} -{" "}
                          {court.location}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="text-sm text-zinc-400">Match Type</span>

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
                      className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
                    >
                      <option value="SINGLES">Singles</option>

                      <option value="DOUBLES">Doubles</option>

                      <option value="MIXED_DOUBLES">Mixed Doubles</option>
                    </select>
                  </label>
                </div>

                <div className="mt-6 text-left">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-zinc-400">Players</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
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
                        className="mt-1.5 text-sm text-zinc-400 hover:text-white"
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
                            className="mt-1.5 text-sm text-zinc-400 hover:text-white"
                          >
                            + Quick Guest
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
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
                        className="mt-1.5 text-sm text-zinc-400 hover:text-white"
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
                            className="mt-1.5 text-sm text-zinc-400 hover:text-white"
                          >
                            + Quick Guest
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {showQuickGuest && (
                  <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900 p-4">
                    <div className="mb-3">
                      <p className="font-medium">Quick Guest</p>
                      <p className="text-sm text-zinc-500">
                        Add a temporary nonmember to this session.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={quickGuestName}
                        onChange={(event) =>
                          setQuickGuestName(event.target.value)
                        }
                        placeholder="Guest name or nickname"
                        className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
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
                        className="rounded-lg border border-zinc-700 px-4 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>

              {editingMatch && manageTab === "SCORE" && (
                <MatchSetsPanel
                  key={editingMatch.id}
                  match={editingMatch}
                  onClose={() => setManageTab("MATCH")}
                  onMatchUpdated={(updatedMatch) => {
                    handleMatchUpdated(updatedMatch);
                    setEditingMatch(updatedMatch);
                  }}
                />
              )}
              <label className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={lightsOn}
                  onChange={(event) => setLightsOn(event.target.checked)}
                />

                <span className="text-sm">Lights On</span>
              </label>
              {error && (
                <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={submitting || activeCourts.length === 0}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingMatch
                      ? "Update Match"
                      : "Create Match"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMatch(null);
                    setCourtId("");
                    setMatchType("DOUBLES");
                    setLightsOn(false);

                    setTeamAPlayer1("");
                    setTeamAPlayer2("");
                    setTeamBPlayer1("");
                    setTeamBPlayer2("");

                    setShowQuickGuest(false);
                    setQuickGuestTarget(null);
                    setQuickGuestName("");

                    setError(null);
                  }}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="mt-6 space-y-2">
        {matches.length === 0 ? (
          <p className="text-sm text-zinc-500">No matches yet.</p>
        ) : (
          matches.map((match, index) => {
            const court = courts.find((court) => court.id === match.courtId);
            const hasCharges = chargedMatchIds.includes(match.id);
            const matchParticipants = participantsByMatch[match.id] ?? [];

            const teamA = matchParticipants.filter(
              (participant) => participant.teamSide === "A",
            );

            const teamB = matchParticipants.filter(
              (participant) => participant.teamSide === "B",
            );
            const canGenerateCharges = [
              "TEAM_A_WIN",
              "TEAM_B_WIN",
              "DRAW",
              "WALKOVER_A",
              "WALKOVER_B",
              "ABANDONED",
            ].includes(match.result);

            return (
              <div key={match.id} className="space-y-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-lg font-semibold">
                        Match #{index + 1}
                      </p>

                      <p className="mt-1 truncate text-sm text-zinc-400">
                        {court?.name ?? `Court ${match.courtId}`} ·{" "}
                        {court?.location}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-zinc-800 px-3 py-1 text-sm">
                      {formatLabel(match.result)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-zinc-800 px-2.5 py-1">
                      {formatLabel(match.matchType)}
                    </span>

                    {match.lightsOn && (
                      <span className="rounded-full bg-zinc-800 px-2.5 py-1">
                        Lights On
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-left">
                      <p className="text-xs font-medium uppercase text-zinc-500">
                        Team A
                      </p>

                      <div className="mt-2 space-y-1">
                        {teamA.length === 0 ? (
                          <p className="text-sm text-zinc-600">Empty</p>
                        ) : (
                          teamA.map((participant) => (
                            <p
                              key={participant.participantId}
                              className="truncate text-sm font-medium"
                              title={participant.nickname}
                            >
                              {participant.nickname}
                            </p>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-left">
                      <p className="text-xs font-medium uppercase text-zinc-500">
                        Team B
                      </p>

                      <div className="mt-2 space-y-1">
                        {teamB.length === 0 ? (
                          <p className="text-sm text-zinc-600">Empty</p>
                        ) : (
                          teamB.map((participant) => (
                            <p
                              key={participant.participantId}
                              className="truncate text-sm font-medium"
                              title={participant.nickname}
                            >
                              {participant.nickname}
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => handleEditMatch(match)}
                      disabled={hasCharges}
                      className="w-full rounded-lg border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Manage Match
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-800 pt-4">
                    <button
                      type="button"
                      onClick={() => handleDeleteMatch(match)}
                      disabled={hasCharges}
                      className="rounded-lg border border-red-900/60 px-3 py-2 text-sm text-red-400 transition hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Delete
                    </button>

                    {!hasCharges ? (
                      <button
                        type="button"
                        onClick={() => handleGenerateCharges(match)}
                        disabled={!canGenerateCharges}
                        className="rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-black transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Generate Charges
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setChargeMatch(match);
                        }}
                        className="col-span-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 sm:col-span-1"
                      >
                        View Charges
                      </button>
                    )}
                  </div>
                </div>

                {chargeMatch?.id === match.id && (
                  <MatchChargesPanel
                    key={match.id}
                    match={match}
                    onClose={() => setChargeMatch(null)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SessionMatchesPanel;
