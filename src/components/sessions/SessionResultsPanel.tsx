import { useEffect, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import type { Session } from "../../types/session";
import type { Match } from "../../types/match";
import type { MatchSet } from "../../types/matchSet";
import type { MatchParticipant } from "../../types/matchParticipant";
import type { Participant } from "../../types/participant";

import { getSessionMatches } from "../../api/matches";
import { getMatchSets } from "../../api/matchSets";
import { getMatchParticipants } from "../../api/matchParticipants";
import { getParticipants } from "../../api/participants";
import { formatDate, formatLabel } from "../../utils/format";
import type { Organization } from "../../types/organization";
import OrganizationBrand from "../ui/OrganizationBrand";

type SessionResultsPanelProps = {
  session: Session;
  organization: Organization | null;
  organizationLogo: string | null;
  onClose: () => void;
};

type MatchResultData = {
  match: Match;
  sets: MatchSet[];
  matchParticipants: MatchParticipant[];
};

function SessionResultsPanel({
  session,
  onClose,
  organization,
  organizationLogo,
}: SessionResultsPanelProps) {
  const [results, setResults] = useState<MatchResultData[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shareRef = useRef<HTMLDivElement | null>(null);

  const [renderShareCard, setRenderShareCard] = useState(false);
  const [sharingPng, setSharingPng] = useState(false);
  const [sharingText, setSharingText] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadResults() {
      try {
        const [matches, participantData] = await Promise.all([
          getSessionMatches(session.id),
          getParticipants(),
        ]);

        const resultData = await Promise.all(
          matches.map(async (match) => {
            const [sets, matchParticipants] = await Promise.all([
              getMatchSets(match.id),
              getMatchParticipants(match.id),
            ]);

            return {
              match,
              sets,
              matchParticipants,
            };
          }),
        );

        if (!ignore) {
          setResults(resultData);
          setParticipants(participantData);
        }
      } catch (err) {
        console.error(err);

        if (!ignore) {
          setError("Failed to load session results");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadResults();

    return () => {
      ignore = true;
    };
  }, [session.id]);

  function getParticipantName(participantId: number) {
    const participant = participants.find(
      (participant) => participant.id === participantId,
    );

    if (!participant) {
      return `Participant #${participantId}`;
    }

    return (
      participant.nickname || `${participant.firstName} ${participant.lastName}`
    );
  }

  function getTeamNames(
    matchParticipants: MatchParticipant[],
    teamSide: "A" | "B",
  ) {
    return matchParticipants
      .filter((participant) => participant.teamSide === teamSide)
      .map((participant) => getParticipantName(participant.participantId))
      .join(" / ");
  }

  function getResultLabel(match: Match, matchParticipants: MatchParticipant[]) {
    if (!match.result) {
      return "Unfinished";
    }

    return getCompactWinnerLabel(match, matchParticipants);
  }

  function buildResultsText() {
    const lines: string[] = [];

    lines.push(organization?.name ?? "RallyLedger");
    lines.push(session.name);
    lines.push(
      `${formatDate(session.sessionDate)} • ${session.startTime} - ${session.endTime}`,
    );
    lines.push("");

    const completedMatches = results.length;
    const uniqueCourts = new Set(results.map((item) => item.match.courtId))
      .size;

    lines.push("SESSION SUMMARY");
    lines.push(`Matches: ${completedMatches}`);
    lines.push(`Courts Used: ${uniqueCourts}`);
    lines.push("");

    [...results]
      .reverse()
      .forEach(({ match, sets, matchParticipants }, index) => {
        const teamAName = getTeamNames(matchParticipants, "A") || "Team A";
        const teamBName = getTeamNames(matchParticipants, "B") || "Team B";

        const teamAScores = getTeamScoreColumns(sets, "A").join(" ");
        const teamBScores = getTeamScoreColumns(sets, "B").join(" ");

        lines.push(`MATCH ${index + 1} · ${formatLabel(match.matchType)}`);
        lines.push(`${teamAName}  ${teamAScores}`);
        lines.push(`${teamBName}  ${teamBScores}`);
        lines.push(getCompactWinnerLabel(match, matchParticipants));
        lines.push("");
      });

    lines.push("Powered by RallyLedger");

    return lines.join("\n");
  }

  async function generateResultsPng() {
    if (!shareRef.current) {
      return null;
    }

    const blob = await toBlob(shareRef.current, {
      cacheBust: true,
      pixelRatio: 2,
    });

    if (!blob) {
      return null;
    }

    const safeSessionName = session.name.toLowerCase().replaceAll(" ", "-");

    return new File([blob], `rallyledger-${safeSessionName}-results.png`, {
      type: "image/png",
    });
  }

  function waitForRender() {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }

  async function handleSharePng() {
    try {
      setSharingPng(true);
      setShareMessage(null);
      setRenderShareCard(true);

      await waitForRender();

      const pngFile = await generateResultsPng();

      if (!pngFile) {
        throw new Error("Failed to generate results image");
      }

      if (
        navigator.share &&
        navigator.canShare?.({
          files: [pngFile],
        })
      ) {
        await navigator.share({
          title: `${session.name} Results`,
          text: `${session.name} match results`,
          files: [pngFile],
        });

        setShareMessage("Results image shared.");
        return;
      }

      const url = URL.createObjectURL(pngFile);

      const link = document.createElement("a");
      link.href = url;
      link.download = pngFile.name;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      setShareMessage("Results PNG downloaded.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      console.error(err);
      setShareMessage("Failed to share results image.");
    } finally {
      setSharingPng(false);
      setRenderShareCard(false);
    }
  }

  async function handleShareText() {
    try {
      setSharingText(true);
      setShareMessage(null);

      await copyText(buildResultsText());

      setShareMessage("Results copied to clipboard.");
    } catch (err) {
      console.error(err);
      setShareMessage("Failed to copy results text.");
    } finally {
      setSharingText(false);
    }
  }

  async function copyText(text: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    document.execCommand("copy");

    document.body.removeChild(textarea);
  }

  function getOrderedSets(sets: MatchSet[]) {
    return [...sets].sort((a, b) => a.setNumber - b.setNumber);
  }

  function getTeamScoreColumns(sets: MatchSet[], teamSide: "A" | "B") {
    const orderedSets = getOrderedSets(sets);

    return orderedSets.map((set) =>
      teamSide === "A" ? set.teamAScore : set.teamBScore,
    );
  }

  function getCompactWinnerLabel(
    match: Match,
    matchParticipants: MatchParticipant[],
  ) {
    const teamAName = getTeamNames(matchParticipants, "A") || "Team A";
    const teamBName = getTeamNames(matchParticipants, "B") || "Team B";

    switch (match.result) {
      case "TEAM_A_WIN":
        return `${teamAName} won`;
      case "TEAM_B_WIN":
        return `${teamBName} won`;
      case "DRAW":
        return "Draw";
      case "WALKOVER_A":
        return `${teamAName} won by walkover`;
      case "WALKOVER_B":
        return `${teamBName} won by walkover`;
      case "CANCELLED":
        return "Cancelled";
      case "POSTPONED":
        return "Postponed";
      case "ABANDONED":
        return "Abandoned";
      case "SCHEDULED":
        return "Scheduled";
      case "IN_PROGRESS":
        return "In Progress";
      default:
        return "Unfinished";
    }
  }

  if (loading) {
    return <p>Loading session results...</p>;
  }
  if (error) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>

        <button
          type="button"
          onClick={onClose}
          className="secondary-action mt-3 rounded-lg px-3 py-2 text-sm"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-left">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Session Results
          </p>

          <h2 className="text-xl font-semibold">{session.name}</h2>

          <p className="mt-1 text-sm text-zinc-500">
            {results.length} {results.length === 1 ? "match" : "matches"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={handleSharePng}
            disabled={sharingPng || sharingText || results.length === 0}
            className="secondary-action rounded-lg px-3 py-2 text-sm disabled:opacity-50"
          >
            {sharingPng ? "Preparing..." : "Share PNG"}
          </button>

          <button
            type="button"
            onClick={handleShareText}
            disabled={sharingPng || sharingText || results.length === 0}
            className="secondary-action rounded-lg px-3 py-2 text-sm disabled:opacity-50"
          >
            {sharingText ? "Copying..." : "Copy Text"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="secondary-action col-span-2 rounded-lg px-3 py-2 text-sm sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>
      {shareMessage && (
        <p className="col-span-2 text-right text-xs text-zinc-600 dark:text-zinc-400">
          {shareMessage}
        </p>
      )}
      <div className="mt-5 space-y-3">
        {results.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No matches recorded for this session.
          </p>
        ) : (
          results.map(({ match, sets, matchParticipants }, index) => {
            const orderedSets = getOrderedSets(sets);

            const teamAPlayers = matchParticipants
              .filter((participant) => participant.teamSide === "A")
              .map((participant) =>
                getParticipantName(participant.participantId),
              );

            const teamBPlayers = matchParticipants
              .filter((participant) => participant.teamSide === "B")
              .map((participant) =>
                getParticipantName(participant.participantId),
              );

            const teamAScores = orderedSets.map((set) => set.teamAScore);

            const teamBScores = orderedSets.map((set) => set.teamBScore);

            return (
              <div
                key={match.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="text-left">
                    <p className="text-xs text-zinc-500">
                      Match {results.length - index}
                    </p>

                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatLabel(match.matchType)}
                    </p>
                  </div>
                  <span className="w-fit max-w-full break-words rounded-full bg-zinc-100 px-3 py-1 text-left text-xs dark:bg-zinc-800">
                    {getResultLabel(match, matchParticipants)}
                  </span>
                </div>

                <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-[1fr_auto]">
                    <div className="flex min-h-[64px] flex-col justify-center px-4 py-3 text-left">
                      {teamAPlayers.length > 0 ? (
                        teamAPlayers.map((name) => (
                          <p key={name} className="font-medium leading-5">
                            {name}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-500">No players</p>
                      )}
                    </div>

                    <div className="flex min-w-[90px] items-center justify-end gap-3 border-l border-zinc-200 dark:border-zinc-800 px-3">
                      {teamAScores.length > 0 ? (
                        teamAScores.map((score, scoreIndex) => (
                          <span
                            key={scoreIndex}
                            className="min-w-[14px] text-center text-lg font-bold"
                          >
                            {score}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex min-h-[64px] flex-col justify-center px-4 py-3 text-left">
                      {teamBPlayers.length > 0 ? (
                        teamBPlayers.map((name) => (
                          <p key={name} className="font-medium leading-5">
                            {name}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-500">No players</p>
                      )}
                    </div>

                    <div className="flex min-w-[90px] items-center justify-end gap-3 border-l border-zinc-200 dark:border-zinc-800 px-3">
                      {teamBScores.length > 0 ? (
                        teamBScores.map((score, scoreIndex) => (
                          <span
                            key={scoreIndex}
                            className="min-w-[14px] text-center text-lg font-bold"
                          >
                            {score}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {renderShareCard && (
        <div className="fixed -left-[9999px] top-0">
          <div ref={shareRef} className="w-[760px] bg-white p-8 text-black">
            {/* HEADER */}
            <div className="mb-6 border-b border-zinc-200 pb-5">
              <OrganizationBrand
                name={organization?.name ?? "RallyLedger"}
                logoDataUrl={organizationLogo}
              />

              <p className="mt-5 text-3xl font-bold leading-tight">
                {session.name}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {formatDate(session.sessionDate)}
                {" · "}
                {session.startTime}–{session.endTime}
              </p>
              <div className="mt-4 flex gap-6 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                    Matches
                  </p>

                  <p className="mt-0.5 text-lg font-bold">{results.length}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                    Courts Used
                  </p>

                  <p className="mt-0.5 text-lg font-bold">
                    {new Set(results.map((item) => item.match.courtId)).size}
                  </p>
                </div>
              </div>
            </div>

            {/* MATCHES */}
            <div className="grid grid-cols-2 items-start gap-x-5 gap-y-5">
              {[...results]
                .reverse()
                .map(({ match, sets, matchParticipants }, index) => {
                  const orderedSets = getOrderedSets(sets);

                  const teamAPlayers = matchParticipants
                    .filter((participant) => participant.teamSide === "A")
                    .map((participant) =>
                      getParticipantName(participant.participantId),
                    );

                  const teamBPlayers = matchParticipants
                    .filter((participant) => participant.teamSide === "B")
                    .map((participant) =>
                      getParticipantName(participant.participantId),
                    );

                  const teamAScores = orderedSets.map((set) => set.teamAScore);

                  const teamBScores = orderedSets.map((set) => set.teamBScore);

                  return (
                    <div key={match.id}>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                        Match {index + 1} · {formatLabel(match.matchType)}
                      </p>

                      <div className="overflow-hidden rounded-lg border border-zinc-300 bg-white">
                        {/* TEAM A */}
                        <div className="grid grid-cols-[1fr_auto]">
                          <div className="flex min-h-[64px] flex-col justify-center px-4 py-2">
                            {teamAPlayers.length > 0 ? (
                              teamAPlayers.map((name) => (
                                <p
                                  key={name}
                                  className="text-[14px] font-medium leading-5"
                                >
                                  {name}
                                </p>
                              ))
                            ) : (
                              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                No players
                              </p>
                            )}
                          </div>

                          <div className="flex min-w-[92px] items-center justify-center gap-3 border-l border-zinc-300 px-3">
                            {teamAScores.length > 0 ? (
                              teamAScores.map((score, scoreIndex) => (
                                <span
                                  key={scoreIndex}
                                  className="min-w-[14px] text-center text-lg font-bold"
                                >
                                  {score}
                                </span>
                              ))
                            ) : (
                              <span className="text-zinc-600 dark:text-zinc-400">
                                —
                              </span>
                            )}
                          </div>
                        </div>

                        {/* TEAM B */}
                        <div className="grid grid-cols-[1fr_auto] border-t border-zinc-300">
                          <div className="flex min-h-[64px] flex-col justify-center px-4 py-2">
                            {teamBPlayers.length > 0 ? (
                              teamBPlayers.map((name) => (
                                <p
                                  key={name}
                                  className="text-[14px] font-medium leading-5"
                                >
                                  {name}
                                </p>
                              ))
                            ) : (
                              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                No players
                              </p>
                            )}
                          </div>

                          <div className="flex min-w-[92px] items-center justify-center gap-3 border-l border-zinc-300 px-3">
                            {teamBScores.length > 0 ? (
                              teamBScores.map((score, scoreIndex) => (
                                <span
                                  key={scoreIndex}
                                  className="min-w-[14px] text-center text-lg font-bold"
                                >
                                  {score}
                                </span>
                              ))
                            ) : (
                              <span className="text-zinc-600 dark:text-zinc-400">
                                —
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="mt-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                        {getCompactWinnerLabel(match, matchParticipants)}
                      </p>
                    </div>
                  );
                })}
            </div>

            <p className="mt-8 text-center text-xs text-zinc-600 dark:text-zinc-400">
              {}Powered by RallyLedger · kurovin
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionResultsPanel;
