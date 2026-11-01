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
import { getCourts } from "../../api/courts";
import { formatDate, formatLabel } from "../../utils/format";
import type { Organization } from "../../types/organization";
import RallyLedgerLoading from "../RallyLedgerLoadingScreen";
import { getMatchBoardCategory } from "../../utils/matchBoard";
import type { Court } from "../../types/court";

type SessionResultsPanelProps = {
  session: Session;
  organization: Organization | null;
  organizationLogo: string | null;
  onClose: () => void;
  onViewMatch: (matchId: number) => void;
};

type ResultsFilter = "COMPLETED" | "EXCEPTIONAL" | "UNFINISHED" | "ALL";

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
  onViewMatch,
}: SessionResultsPanelProps) {
  const [results, setResults] = useState<MatchResultData[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [resultsFilter, setResultsFilter] = useState<ResultsFilter>("COMPLETED");
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
        const [matches, participantData, courtData] = await Promise.all([
          getSessionMatches(session.id),
          getParticipants(),
          getCourts().catch(() => [] as Court[]),
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
          setCourts(courtData);
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

    const bounds = shareRef.current.getBoundingClientRect();
    const pixelRatio = Math.min(2, 16000 / Math.max(bounds.width, bounds.height));

    const blob = await toBlob(shareRef.current, {
      cacheBust: true,
      pixelRatio,
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

  const filterCounts = {
    COMPLETED: results.filter(({ match }) => getMatchBoardCategory(match) === "COMPLETED").length,
    EXCEPTIONAL: results.filter(({ match }) => getMatchBoardCategory(match) === "EXCEPTIONAL").length,
    UNFINISHED: results.filter(({ match }) => ["IN_PROGRESS", "SCHEDULED"].includes(match.result)).length,
    ALL: results.length,
  };
  const visibleResults = results.filter(({ match }) => {
    if (resultsFilter === "ALL") return true;
    if (resultsFilter === "UNFINISHED") return ["IN_PROGRESS", "SCHEDULED"].includes(match.result);
    return getMatchBoardCategory(match) === resultsFilter;
  });

if (loading) {
  return (
    <RallyLedgerLoading
      heading="Getting your club ready"
      message="Loading session results..."
      portalLabel="RallyLedger Admin Portal"
    />
  );
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
    <section aria-label="Session results" className="space-y-3">
      <div className="flex flex-col gap-3 rounded-xl bg-[#14251B] px-4 py-3.5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0 text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D8C86E]">Match results</p>
          <h2 className="mt-1 break-words text-lg font-bold sm:text-xl">{session.name}</h2>
          <p className="mt-1 text-sm text-white/70">{formatDate(session.sessionDate)} · {results.length} {results.length === 1 ? "match" : "matches"}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={handleSharePng}
            disabled={sharingPng || sharingText || results.length === 0}
            className="min-h-10 rounded-lg border border-white/25 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
          >
            {sharingPng ? "Preparing..." : "Share PNG"}
          </button>

          <button
            type="button"
            onClick={handleShareText}
            disabled={sharingPng || sharingText || results.length === 0}
            className="min-h-10 rounded-lg border border-white/25 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
          >
            {sharingText ? "Copying..." : "Copy Text"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="secondary-action col-span-2 min-h-10 rounded-lg px-3 py-2 text-sm sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>
      {shareMessage && <p role="status" className="text-right text-xs text-stone-600 dark:text-stone-300">{shareMessage}</p>}
      <div>
        <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-stone-100 p-1 sm:flex sm:flex-wrap dark:bg-stone-900/70" role="group" aria-label="Filter session results">
          {([
            ["COMPLETED", "Final results"],
            ["EXCEPTIONAL", "Exceptional"],
            ["UNFINISHED", "Unfinished"],
            ["ALL", "All matches"],
          ] as const).map(([filter, label]) => (
            <button key={filter} type="button" aria-pressed={resultsFilter === filter}
              onClick={() => setResultsFilter(filter)}
              className={`min-h-9 rounded-md px-2.5 py-1.5 text-xs font-semibold sm:flex-none sm:px-3 sm:text-sm ${resultsFilter === filter ? "bg-[#183E2A] text-white shadow-sm dark:bg-[#D8C86E] dark:text-[#14251B]" : "text-stone-600 hover:bg-white dark:text-stone-300 dark:hover:bg-stone-800"}`}>
              {label} <span className="ml-1 tabular-nums opacity-75">{filterCounts[filter]}</span>
            </button>
          ))}
        </div>
        <p className="mb-2 text-xs text-stone-500 dark:text-stone-400">Sharing includes all matches, regardless of the selected filter.</p>
        <div className="space-y-2">
        {results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 px-4 py-7 text-center dark:border-stone-700">
            <p className="font-semibold">No matches in this session yet</p>
            <p className="mt-1 text-sm text-stone-500">Add a match from the Matches section to see its result here.</p>
          </div>
        ) : visibleResults.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center dark:border-stone-700">
            <p className="text-sm font-medium">No {resultsFilter === "COMPLETED" ? "final results" : resultsFilter.toLowerCase() + " matches"} yet.</p>
            <p className="mt-1 text-xs text-stone-500">Choose another filter to view the rest of this session.</p>
          </div>
        ) : (
          visibleResults.map(({ match, sets, matchParticipants }) => {
            const orderedSets = getOrderedSets(sets);
            const winnerSide = ["TEAM_A_WIN", "WALKOVER_A"].includes(match.result) ? "A" : ["TEAM_B_WIN", "WALKOVER_B"].includes(match.result) ? "B" : null;
            const walkover = match.result === "WALKOVER_A" || match.result === "WALKOVER_B";
            const ordinaryWin = match.result === "TEAM_A_WIN" || match.result === "TEAM_B_WIN";
            const category = getMatchBoardCategory(match);
            const statusLabel = category === "IN_PROGRESS" ? "In progress" : category === "SCHEDULED" ? "Scheduled" : category === "COMPLETED" ? "Completed" : "Exceptional";
            const outcomeLabel = category === "IN_PROGRESS" || category === "SCHEDULED" ? "Pending" : getResultLabel(match, matchParticipants);
            const matchNumber = results.length - results.findIndex((item) => item.match.id === match.id);
            const court = courts.find((item) => item.id === match.courtId);
            const courtName = court ? [court.name, court.location].filter(Boolean).join(" · ") : `Court ${match.courtId}`;
            const badgeClass = ordinaryWin
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
              : walkover || match.result === "DRAW" || match.result === "ABANDONED" || category === "EXCEPTIONAL"
                ? "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200"
                : "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200";

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
            const teamAWonSets = teamAScores.filter((score, index) => score > teamBScores[index]).length;
            const teamBWonSets = teamBScores.filter((score, index) => score > teamAScores[index]).length;
            const setsOutcome = teamAWonSets === teamBWonSets ? "Sets level" : `Team ${teamAWonSets > teamBWonSets ? "A" : "B"} won ${Math.max(teamAWonSets, teamBWonSets)}–${Math.min(teamAWonSets, teamBWonSets)} sets`;

            return (
              <div
                key={match.id}
                className="overflow-hidden border-b border-stone-200 pb-2 dark:border-stone-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-2 dark:border-stone-800">
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-bold">Match #{matchNumber} <span className="font-normal text-stone-600 dark:text-stone-300">· {formatLabel(match.matchType)}</span></p>
                    <p className="mt-0.5 break-words text-xs text-stone-500 dark:text-stone-400">{courtName}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
                    <span className={`rounded-full border px-2.5 py-1 ${badgeClass}`}>Status · {statusLabel}</span>
                    <span className="rounded-full border border-stone-200 px-2.5 py-1 text-stone-600 dark:border-stone-700 dark:text-stone-300">Outcome · {outcomeLabel}</span>
                  </div>
                </div>

                <div className="overflow-hidden">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] px-3 pt-2 sm:px-4">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Saved set scores</span>
                    <div className="flex min-w-[76px] justify-end gap-2 text-[10px] font-semibold text-stone-500 sm:min-w-[90px] sm:gap-3">
                      {orderedSets.map((set) => <span key={set.setNumber} className="min-w-[14px] text-center">S{set.setNumber}</span>)}
                    </div>
                  </div>
                  <div className={`grid grid-cols-[minmax(0,1fr)_auto] ${winnerSide === "A" ? walkover ? "bg-[#FAF7E9]/70 dark:bg-[#292719]/60" : "bg-emerald-50/70 dark:bg-emerald-950/20" : ""}`}>
                    <div className="flex min-h-14 min-w-0 flex-col justify-center px-3 py-2.5 text-left sm:px-4">
                      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-500">Team A {winnerSide === "A" && <span className="ml-1 text-emerald-800 dark:text-lime-300">· Winner</span>}</p>
                      {teamAPlayers.length > 0 ? (
                        teamAPlayers.map((name) => (
                          <p key={name} className={`break-words leading-5 ${winnerSide === "A" ? walkover ? "font-bold text-[#554D20] dark:text-[#E8DB87]" : "font-bold text-emerald-950 dark:text-emerald-100" : "font-medium"}`}>
                            {name}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-500">No players</p>
                      )}
                    </div>

                    <div className="flex min-w-[76px] items-center justify-end gap-2 border-l border-stone-200 px-2 dark:border-stone-800 sm:min-w-[90px] sm:gap-3 sm:px-3">
                      {teamAScores.length > 0 ? (
                        teamAScores.map((score, scoreIndex) => (
                          <span
                            key={scoreIndex}
                            className={`min-w-[14px] text-center text-lg tabular-nums ${winnerSide === "A" ? walkover ? "font-extrabold text-[#554D20] dark:text-[#E8DB87]" : "font-extrabold text-emerald-900 dark:text-emerald-100" : "font-bold"}`}
                          >
                            {score}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </div>
                  </div>

                  <p className="py-0.5 text-center text-[9px] font-bold uppercase tracking-wider text-stone-400">VS</p>
                  <div className={`grid grid-cols-[minmax(0,1fr)_auto] border-t border-stone-200 dark:border-stone-800 ${winnerSide === "B" ? walkover ? "bg-[#FAF7E9]/70 dark:bg-[#292719]/60" : "bg-emerald-50/70 dark:bg-emerald-950/20" : ""}`}>
                    <div className="flex min-h-14 min-w-0 flex-col justify-center px-3 py-2.5 text-left sm:px-4">
                      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-500">Team B {winnerSide === "B" && <span className="ml-1 text-emerald-800 dark:text-lime-300">· Winner</span>}</p>
                      {teamBPlayers.length > 0 ? (
                        teamBPlayers.map((name) => (
                          <p key={name} className={`break-words leading-5 ${winnerSide === "B" ? walkover ? "font-bold text-[#554D20] dark:text-[#E8DB87]" : "font-bold text-emerald-950 dark:text-emerald-100" : "font-medium"}`}>
                            {name}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-500">No players</p>
                      )}
                    </div>

                    <div className="flex min-w-[76px] items-center justify-end gap-2 border-l border-stone-200 px-2 dark:border-stone-800 sm:min-w-[90px] sm:gap-3 sm:px-3">
                      {teamBScores.length > 0 ? (
                        teamBScores.map((score, scoreIndex) => (
                          <span
                            key={scoreIndex}
                            className={`min-w-[14px] text-center text-lg tabular-nums ${winnerSide === "B" ? walkover ? "font-extrabold text-[#554D20] dark:text-[#E8DB87]" : "font-extrabold text-emerald-900 dark:text-emerald-100" : "font-bold"}`}
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
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 px-3 py-2 dark:border-stone-800 sm:px-4">
                  {orderedSets.length > 0 && <span className="text-[10px] text-stone-500">Set outcome · {setsOutcome}</span>}
                  {winnerSide && <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Team {winnerSide} won</span>}
                  {!ordinaryWin && !walkover && category === "COMPLETED" && <span className="text-xs text-stone-600 dark:text-stone-300">No winning team recorded</span>}
                  {category !== "COMPLETED" && <span className="text-xs text-stone-500">{category === "EXCEPTIONAL" ? "Exceptional outcome" : "Match not finished"}</span>}
                  <button type="button" onClick={() => onViewMatch(match.id)} className="min-h-9 rounded-lg px-2.5 text-xs font-semibold text-[#183E2A] hover:bg-emerald-50 dark:text-[#D8C86E] dark:hover:bg-stone-800">View match</button>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>
      {renderShareCard && (
        <div className="fixed -left-[9999px] top-0">
          <div
            ref={shareRef}
            style={{
              position: "relative",
              width: 1080,
              minHeight: 560 + Math.ceil(results.length / (results.length === 1 ? 1 : 2)) * 360,
              boxSizing: "border-box",
              padding: 64,
              overflow: "hidden",
              background: "#f1eee5",
              color: "#153323",
              fontFamily: "Manrope, DM Sans, Arial, sans-serif",
            }}
          >
            <div style={{ position: "absolute", inset: 22, border: "2px solid rgba(16,63,37,.12)", pointerEvents: "none" }} />
            <header style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 28, borderBottom: "2px solid rgba(16,63,37,.2)", paddingBottom: 34 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, color: "#857636", fontSize: 17, fontWeight: 900, letterSpacing: 5 }}>REGULAR PLAY · SESSION RESULTS</p>
                <h1 style={{ margin: "22px 0 0", maxWidth: 850, color: "#103f25", fontSize: 62, fontWeight: 900, lineHeight: 1.04, overflowWrap: "anywhere" }}>{session.name}</h1>
                <p style={{ margin: "14px 0 0", color: "#153323", fontSize: 20, fontWeight: 600 }}>{formatDate(session.sessionDate)} · {session.startTime}–{session.endTime}</p>
                <p style={{ margin: "8px 0 0", color: "#55705e", fontSize: 16 }}>{organization?.name ?? "RallyLedger"}</p>
              </div>
              <div style={{ display: "flex", minWidth: 150, flexDirection: "column", alignItems: "flex-end", gap: 14 }}>
                {organizationLogo ? (
                  <img src={organizationLogo} alt="" crossOrigin="anonymous" style={{ maxWidth: 150, maxHeight: 68, objectFit: "contain" }} />
                ) : (
                  <span style={{ color: "#103f25", fontSize: 22, fontWeight: 1000, letterSpacing: 2 }}>RALLYLEDGER</span>
                )}
                <div style={{ borderLeft: "4px solid #d8c86e", background: "#103f25", padding: "10px 16px", textAlign: "right" }}>
                  <p style={{ margin: 0, color: "#e5d88d", fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>MATCHES</p>
                  <p style={{ margin: "3px 0 0", color: "#fffdf5", fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{results.length}</p>
                </div>
              </div>
            </header>

            <div style={{ position: "relative", display: "grid", gridTemplateColumns: results.length === 1 ? "minmax(0,1fr)" : "repeat(2,minmax(0,1fr))", alignItems: "start", gap: 18, marginTop: 28 }}>
              {[...results]
                .reverse()
                .map(({ match, sets, matchParticipants }, index) => {
                  const orderedSets = getOrderedSets(sets);
                  const teamAPlayers = matchParticipants.filter((participant) => participant.teamSide === "A").map((participant) => getParticipantName(participant.participantId));
                  const teamBPlayers = matchParticipants.filter((participant) => participant.teamSide === "B").map((participant) => getParticipantName(participant.participantId));
                  const winnerSide = match.result === "TEAM_A_WIN" || match.result === "WALKOVER_A" ? "A" : match.result === "TEAM_B_WIN" || match.result === "WALKOVER_B" ? "B" : null;
                  const court = courts.find((item) => item.id === match.courtId);
                  const courtLabel = court ? [court.name, court.location].filter(Boolean).join(" · ") : `Court ${match.courtId}`;

                  return (
                    <article key={match.id} style={{ minWidth: 0, breakInside: "avoid", border: "2px solid #d8c86e", background: "#fffdf5", color: "#153323" }}>
                      <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "5px 12px", padding: "13px 17px", background: "#103f25", color: "#fffdf5", borderBottom: "1px solid rgba(16,63,37,.16)" }}>
                        <span style={{ color: "#e5d88d", fontSize: 14, fontWeight: 900, letterSpacing: 1.5 }}>MATCH {index + 1}</span>
                        <span style={{ color: "#fffbe3", fontSize: 16, fontWeight: 800 }}>{formatLabel(match.matchType)}</span>
                        <span style={{ color: "#b2d9bf", fontSize: 12, overflowWrap: "anywhere" }}>{courtLabel}</span>
                      </div>

                      <div style={{ padding: "12px 16px 8px" }}>
                        {[{ side: "A", names: teamAPlayers, winner: winnerSide === "A" }, { side: "B", names: teamBPlayers, winner: winnerSide === "B" }].map((team, teamIndex) => (
                          <div key={team.side}>
                            {teamIndex === 1 && <p style={{ margin: "5px 0", textAlign: "center", color: "#718276", fontSize: 10, fontWeight: 900, letterSpacing: 3 }}>VS</p>}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "12px 13px", borderLeft: team.winner ? "5px solid #b9a64e" : "5px solid transparent", background: team.winner ? "#e8e1c7" : "#fffdf5" }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ color: "#55705e", fontSize: 10, fontWeight: 900, letterSpacing: 1.5 }}>TEAM {team.side}</span>
                                  {team.winner && <span style={{ color: "#103f25", fontSize: 12, fontWeight: 1000 }}>WINNER</span>}
                                </div>
                                <div style={{ marginTop: 4 }}>
                                  {team.names.length > 0 ? team.names.map((name) => <p key={name} style={{ margin: "3px 0", color: "#153323", fontSize: 18, fontWeight: team.winner ? 900 : 700, lineHeight: 1.25, overflowWrap: "anywhere" }}>{name}</p>) : <p style={{ margin: "2px 0", color: "#718276", fontSize: 14 }}>No players assigned</p>}
                                </div>
                              </div>
                              <div style={{ display: "flex", maxWidth: "52%", flexWrap: "wrap", justifyContent: "flex-end", gap: 6 }}>
                                {orderedSets.length > 0 ? orderedSets.map((set) => (
                                  <span key={set.setNumber} style={{ display: "inline-flex", alignItems: "baseline", gap: 4, padding: "6px 8px", background: "#f1eee5", color: "#153323", fontSize: 14, fontWeight: 900, whiteSpace: "nowrap" }}>
                                    <span style={{ color: "#718276", fontSize: 10 }}>S{set.setNumber}</span>{team.side === "A" ? set.teamAScore : set.teamBScore}
                                  </span>
                                )) : <span style={{ color: "#718276", fontSize: 12 }}>No saved sets</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 46, padding: "10px 17px", background: "#e8e1c7" }}>
                        <span style={{ color: "#55705e", fontSize: 10, fontWeight: 900, letterSpacing: 1.5 }}>OUTCOME</span>
                        <span style={{ color: winnerSide ? "#103f25" : "#153323", fontSize: 15, fontWeight: 900, textAlign: "right", overflowWrap: "anywhere" }}>{getCompactWinnerLabel(match, matchParticipants)}</span>
                      </div>
                    </article>
                  );
                })}
            </div>

            <footer style={{ position: "relative", marginTop: 32, paddingTop: 18, borderTop: "1px solid rgba(16,63,37,.2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
              <span style={{ color: "#103f25", fontSize: 17, fontWeight: 900, letterSpacing: 3 }}>RALLYLEDGER</span>
              <span style={{ color: "#55705e", fontSize: 12, fontWeight: 600 }}>PLAY · TRAIN · COMPETE</span>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}

export default SessionResultsPanel;
