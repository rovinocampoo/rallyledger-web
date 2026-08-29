import { useEffect, useState } from "react";
import {
  addMatchParticipant,
  getMatchParticipants,
  removeMatchParticipant,
  updateMatchParticipantTeam,
} from "../../api/matchParticipants";
import {
  addSessionParticipant,
  getSessionParticipants,
} from "../../api/sessionParticipants";
import type { Match } from "../../types/match";
import type { Session } from "../../types/session";
import type { MatchParticipant } from "../../types/matchParticipant";
import type { SessionParticipant } from "../../types/sessionParticipant";
import { getParticipants } from "../../api/participants";
import type { Participant } from "../../types/participant";
import { formatFullName } from "../../utils/format";
import ParticipantPicker from "../ui/ParticipantPicker";

type MatchParticipantsPanelProps = {
  match: Match;
  session: Session;
  onClose: () => void;
};

function MatchParticipantsPanel({
  match,
  session,
  onClose,
}: MatchParticipantsPanelProps) {
  const [matchParticipants, setMatchParticipants] = useState<
    MatchParticipant[]
  >([]);

  const [sessionParticipants, setSessionParticipants] = useState<
    SessionParticipant[]
  >([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [teamSide, setTeamSide] = useState("A");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const teamA = matchParticipants.filter(
    (participant) => participant.teamSide === "A",
  );

  const teamB = matchParticipants.filter(
    (participant) => participant.teamSide === "B",
  );

  const availableParticipants = participants.filter((participant) => {
    const alreadyInMatch = matchParticipants.some(
      (matchParticipant) => matchParticipant.participantId === participant.id,
    );

    return !alreadyInMatch && !participant.isTemporary;
  });

  useEffect(() => {
    let ignore = false;

    Promise.all([
      getMatchParticipants(match.id),
      getSessionParticipants(session.id),
      getParticipants(),
    ])
      .then(([matchData, sessionData, participantData]) => {
        if (!ignore) {
          setMatchParticipants(matchData);
          setSessionParticipants(sessionData);
          setParticipants(participantData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError("Failed to load match players");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [match.id, session.id]);

  async function handleAddParticipant() {
    if (!selectedParticipantId) {
      return;
    }

    try {
      setError(null);

      const participantId = Number(selectedParticipantId);

      const alreadyInSession = sessionParticipants.some(
        (sessionParticipant) =>
          sessionParticipant.participantId === participantId,
      );

      if (!alreadyInSession) {
        await addSessionParticipant(session.id, participantId);

        const updatedSessionParticipants = await getSessionParticipants(
          session.id,
        );
        setSessionParticipants(updatedSessionParticipants);
      }

      await addMatchParticipant(match.id, participantId, teamSide);

      await loadMatchParticipants();

      setSelectedParticipantId("");
    } catch (err) {
      console.error(err);

      if (!(err instanceof Error)) {
        setError("Failed to add player to match");
        return;
      }

      if (err.message === "match team full") {
        setError("Team is already full.");
        return;
      }

      setError(err.message);
    }
  }

  async function loadMatchParticipants() {
    const data = await getMatchParticipants(match.id);
    setMatchParticipants(data);
  }

  async function handleRemoveParticipant(participantId: number) {
    const confirmed = window.confirm("Remove this player from the match?");

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await removeMatchParticipant(match.id, participantId);

      await loadMatchParticipants();
    } catch (err) {
      console.error(err);
      setError("Failed to remove player from match");
    }
  }

  async function handleMoveParticipant(
    participantId: number,
    newTeamSide: string,
  ) {
    try {
      setError(null);

      await updateMatchParticipantTeam(match.id, participantId, newTeamSide);

      await loadMatchParticipants();
    } catch (err) {
      console.error(err);

      if (!(err instanceof Error)) {
        setError("Failed to move player");
        return;
      }

      if (err.message === "match team full") {
        setError("That team is already full.");
        return;
      }

      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="mt-5 min-w-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading match players...</p>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Match Players</p>

          <h3 className="text-lg font-semibold">Match #{match.id}</h3>

          <p className="text-sm text-zinc-500">{match.matchType}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
        >
          Close
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
        <ParticipantPicker
          participants={availableParticipants}
          selectedParticipantId={selectedParticipantId}
          onSelect={setSelectedParticipantId}
          placeholder="Search session player..."
        />
        <select
          value={teamSide}
          onChange={(event) => setTeamSide(event.target.value)}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 sm:w-auto"
        >
          <option value="A">Team A</option>
          <option value="B">Team B</option>
        </select>
        <button
          type="button"
          onClick={handleAddParticipant}
          disabled={!selectedParticipantId}
          className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black sm:w-auto"
        >
          Add Player
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-left text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Team A
          </h4>

          <div className="space-y-2">
            {teamA.length === 0 ? (
              <p className="text-sm text-zinc-500">No players yet.</p>
            ) : (
              teamA.map((matchParticipant) => {
                const participant = participants.find(
                  (participant) =>
                    participant.id === matchParticipant.participantId,
                );

                return (
                  <div
                    key={matchParticipant.participantId}
                    className="rounded-lg bg-white dark:bg-zinc-900 p-3"
                  >
                    <div className="min-w-0 text-left">
                      <p className="truncate font-medium">
                        {matchParticipant.nickname ||
                          (participant
                            ? formatFullName(
                                participant.firstName,
                                participant.lastName,
                              )
                            : `Participant #${matchParticipant.participantId}`)}
                      </p>

                      {participant && matchParticipant.nickname && (
                        <p className="truncate text-xs text-zinc-500">
                          {formatFullName(
                            participant.firstName,
                            participant.lastName,
                          )}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveParticipant(
                            matchParticipant.participantId,
                          )
                        }
                        className="rounded-lg border border-red-900/60 px-3 py-2 text-xs text-red-400 hover:bg-red-950/30"
                      >
                        Remove
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleMoveParticipant(
                            matchParticipant.participantId,
                            "B",
                          )
                        }
                        className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Move to Team B
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-left text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Team B
          </h4>

          <div className="space-y-2">
            {teamB.length === 0 ? (
              <p className="text-sm text-zinc-500">No players yet.</p>
            ) : (
              teamB.map((matchParticipant) => {
                const participant = participants.find(
                  (participant) =>
                    participant.id === matchParticipant.participantId,
                );

                return (
                  <div
                    key={matchParticipant.participantId}
                    className="rounded-lg bg-white dark:bg-zinc-900 p-3"
                  >
                    <div className="min-w-0 text-left">
                      <p className="truncate font-medium">
                        {matchParticipant.nickname ||
                          (participant
                            ? formatFullName(
                                participant.firstName,
                                participant.lastName,
                              )
                            : `Participant #${matchParticipant.participantId}`)}
                      </p>

                      {participant && matchParticipant.nickname && (
                        <p className="truncate text-xs text-zinc-500">
                          {formatFullName(
                            participant.firstName,
                            participant.lastName,
                          )}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveParticipant(
                            matchParticipant.participantId,
                          )
                        }
                        className="rounded-lg border border-red-900/60 px-3 py-2 text-xs text-red-400 hover:bg-red-950/30"
                      >
                        Remove
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleMoveParticipant(
                            matchParticipant.participantId,
                            "A",
                          )
                        }
                        className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Move to Team A
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchParticipantsPanel;
