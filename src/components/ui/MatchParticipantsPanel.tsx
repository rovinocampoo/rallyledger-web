import { useEffect, useState } from "react";
import {
  addMatchParticipant,
  getMatchParticipants,
  removeMatchParticipant,
  updateMatchParticipantTeam,
} from "../../api/matchParticipants";
import { getSessionParticipants } from "../../api/sessionParticipants";
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
    const belongsToSession = sessionParticipants.some(
      (sessionParticipant) =>
        sessionParticipant.participantId === participant.id,
    );

    const alreadyInMatch = matchParticipants.some(
      (matchParticipant) => matchParticipant.participantId === participant.id,
    );

    return belongsToSession && !alreadyInMatch;
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

      await addMatchParticipant(
        match.id,
        Number(selectedParticipantId),
        teamSide,
      );

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
      <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <p className="text-sm text-zinc-400">Loading match players...</p>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-400">Match Players</p>

          <h3 className="text-lg font-semibold">Match #{match.id}</h3>

          <p className="text-sm text-zinc-500">{match.matchType}</p>
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

      <div className="mt-5 flex flex-wrap gap-2">
        <ParticipantPicker
          participants={availableParticipants}
          selectedParticipantId={selectedParticipantId}
          onSelect={setSelectedParticipantId}
          placeholder="Search session player..."
        />

        <select
          value={teamSide}
          onChange={(event) => setTeamSide(event.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
        >
          <option value="A">Team A</option>
          <option value="B">Team B</option>
        </select>

        <button
          type="button"
          onClick={handleAddParticipant}
          disabled={!selectedParticipantId}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          Add Player
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2 font-semibold">Team A</h4>

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
                    className="flex items-center justify-between gap-3 rounded-lg bg-zinc-900 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {matchParticipant.nickname ||
                          (participant
                            ? formatFullName(
                                participant.firstName,
                                participant.lastName,
                              )
                            : `Participant #${matchParticipant.participantId}`)}
                      </p>

                      {participant && matchParticipant.nickname && (
                        <p className="text-xs text-zinc-500">
                          {formatFullName(
                            participant.firstName,
                            participant.lastName,
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveParticipant(
                            matchParticipant.participantId,
                          )
                        }
                        className="text-xs text-red-400 hover:text-red-300"
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
                        className="text-xs text-zinc-400 hover:text-white"
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
          <h4 className="mb-2 font-semibold">Team B</h4>

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
                    className="flex items-center justify-between gap-3 rounded-lg bg-zinc-900 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {matchParticipant.nickname ||
                          (participant
                            ? formatFullName(
                                participant.firstName,
                                participant.lastName,
                              )
                            : `Participant #${matchParticipant.participantId}`)}
                      </p>

                      {participant && matchParticipant.nickname && (
                        <p className="text-xs text-zinc-500">
                          {formatFullName(
                            participant.firstName,
                            participant.lastName,
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveParticipant(
                            matchParticipant.participantId,
                          )
                        }
                        className="text-xs text-red-400 hover:text-red-300"
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
                        className="text-xs text-zinc-400 hover:text-white"
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
