import type { Match } from "../../types/match";
import type { MatchParticipant } from "../../types/matchParticipant";
import type { MatchSet } from "../../types/matchSet";
import { formatLabel } from "../../utils/format";
import { getMatchBoardCategory } from "../../utils/matchBoard";

type MatchBoardCardProps = {
  match: Match;
  matchNumber: number;
  courtLabel: string;
  participants: MatchParticipant[];
  sets: MatchSet[];
  charged: boolean;
  chargeStateUnknown: boolean;
  checkingCharges: boolean;
  canDelete: boolean;
  canGenerateCharges: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onGenerateCharges: () => void;
  onViewCharges: () => void;
};

function MatchBoardCard({
  match,
  matchNumber,
  courtLabel,
  participants,
  sets,
  charged,
  chargeStateUnknown,
  checkingCharges,
  canDelete,
  canGenerateCharges,
  onOpen,
  onDelete,
  onGenerateCharges,
  onViewCharges,
}: MatchBoardCardProps) {
  const category = getMatchBoardCategory(match);
  const teamA = participants.filter((participant) => participant.teamSide === "A");
  const teamB = participants.filter((participant) => participant.teamSide === "B");
  const winnerSide =
    match.result === "TEAM_A_WIN" || match.result === "WALKOVER_A"
      ? "A"
      : match.result === "TEAM_B_WIN" || match.result === "WALKOVER_B"
        ? "B"
        : null;
  const categoryLabel =
    category === "IN_PROGRESS" ? "In progress" :
    category === "SCHEDULED" ? "Scheduled" :
    category === "COMPLETED" ? "Completed" : "Exceptional";
  const outcomeLabel = category === "IN_PROGRESS" || category === "SCHEDULED"
    ? "Pending"
    : formatLabel(match.result);
  const statusClass = category === "IN_PROGRESS"
    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
    : category === "SCHEDULED"
      ? "border-[#E2D79F] bg-[#FAF7E9] text-[#554F32] dark:border-[#766D3C] dark:bg-[#292719] dark:text-[#E5DAA5]"
      : category === "EXCEPTIONAL"
        ? "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200"
        : "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200";
  const orderedSets = [...sets].sort((a, b) => a.setNumber - b.setNumber);
  const teamAWins = orderedSets.filter((set) => set.teamAScore > set.teamBScore).length;
  const teamBWins = orderedSets.filter((set) => set.teamBScore > set.teamAScore).length;
  const setOutcome = teamAWins === teamBWins
    ? "Sets level"
    : `Team ${teamAWins > teamBWins ? "A" : "B"} won ${Math.max(teamAWins, teamBWins)}–${Math.min(teamAWins, teamBWins)} sets`;

  function renderTeam(side: "A" | "B", players: MatchParticipant[]) {
    const isWinner = winnerSide === side;
    const expectedPlayers = match.matchType === "SINGLES" ? 1 : 2;
    const names = Array.from({ length: expectedPlayers }, (_, index) =>
      players[index]?.nickname?.trim() || "Awaiting player",
    );

    return (
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">Team {side}</span>
          {isWinner && <span className="text-[10px] font-bold text-emerald-800 dark:text-lime-300">Winner</span>}
        </div>
        <div className="mt-0.5 min-w-0">
          {names.map((name, index) => (
            <p key={`${side}-${index}`} className={`break-words text-sm leading-5 ${isWinner ? "font-semibold text-emerald-950 dark:text-emerald-100" : "text-stone-800 dark:text-stone-100"} ${name === "Awaiting player" ? "text-stone-400 dark:text-stone-500" : ""}`}>
              {name}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <article className="border-b border-stone-200 py-3 last:border-b-0 dark:border-stone-800">
      <div className="grid min-w-0 gap-x-5 gap-y-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center xl:grid-cols-[minmax(180px,0.8fr)_minmax(260px,1.1fr)_minmax(160px,0.75fr)_auto]">
        <div className="min-w-0 lg:col-span-2 xl:col-span-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-sm font-bold text-stone-950 dark:text-white">Match #{matchNumber}</h3>
            <span className="text-xs text-stone-600 dark:text-stone-300">{formatLabel(match.matchType)}</span>
            {match.lightUsage !== "NONE" && <span className="text-xs text-stone-500">{match.lightUsage === "HALF" ? "Half lights" : "Full lights"}</span>}
          </div>
          <p className="mt-0.5 break-words text-xs text-stone-500 dark:text-stone-400">{courtLabel}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-semibold">
            <span className={`rounded-full border px-2 py-0.5 ${statusClass}`}>Status · {categoryLabel}</span>
            <span className="rounded-full border border-stone-200 px-2 py-0.5 text-stone-600 dark:border-stone-700 dark:text-stone-300">Outcome · {outcomeLabel}</span>
            {charged && <span className="rounded-full border border-[#D4C46A] bg-[#FAF7E9] px-2 py-0.5 text-[#554F32] dark:border-[#766D3C] dark:bg-[#292719] dark:text-[#E5DAA5]">Charged · locked</span>}
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-y border-stone-100 py-2 dark:border-stone-800 lg:col-start-1 lg:row-start-2 lg:border-y-0 lg:py-0 xl:col-start-2 xl:row-start-1">
          {renderTeam("A", teamA)}
          <span aria-label="versus" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">VS</span>
          {renderTeam("B", teamB)}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-1.5 lg:col-start-1 lg:row-start-3 lg:justify-start xl:col-start-3 xl:row-start-1 xl:justify-end">
          {orderedSets.length > 0 ? orderedSets.map((set) => (
            <span key={set.setNumber} className="whitespace-nowrap rounded-md bg-stone-50 px-2 py-1 text-xs tabular-nums text-stone-700 dark:bg-stone-900 dark:text-stone-200" aria-label={`Set ${set.setNumber}: Team A ${set.teamAScore}, Team B ${set.teamBScore}`}>
              <span className="mr-1 text-[10px] text-stone-500">S{set.setNumber}</span>
              <span className={set.teamAScore > set.teamBScore ? "font-bold text-emerald-800 dark:text-lime-300" : ""}>{set.teamAScore}</span>
              <span className="mx-1 text-stone-400">–</span>
              <span className={set.teamBScore > set.teamAScore ? "font-bold text-emerald-800 dark:text-lime-300" : ""}>{set.teamBScore}</span>
            </span>
          )) : <span className="text-xs text-stone-500">No sets</span>}
          {orderedSets.length > 0 && <span className="w-full text-[10px] text-stone-500 lg:text-right">{setOutcome}</span>}
        </div>

        <div className="flex flex-wrap gap-1.5 lg:col-start-2 lg:row-start-3 lg:items-center lg:justify-end xl:col-start-4 xl:row-start-1 xl:items-start">
          <button type="button" disabled={checkingCharges} onClick={onOpen} className="min-h-9 rounded-lg bg-[#183E2A] px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-lime-300 dark:text-[#15251A]">
            {checkingCharges ? "Checking…" : chargeStateUnknown ? "Verify lock" : charged ? "View scorecard" : "Manage scorecard"}
          </button>
          {canDelete && <button type="button" disabled={charged || chargeStateUnknown || checkingCharges} onClick={onDelete} className="min-h-9 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700">Delete</button>}
          {charged ? (
            <button type="button" onClick={onViewCharges} className="min-h-9 rounded-lg border border-[#D4C46A] px-3 py-1.5 text-xs font-semibold text-[#554F32] dark:border-[#766D3C] dark:text-[#E5DAA5]">View charges</button>
          ) : (
            <button type="button" disabled={!canGenerateCharges || chargeStateUnknown || checkingCharges} onClick={onGenerateCharges} className="min-h-9 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700">Generate charges</button>
          )}
        </div>
      </div>
      {chargeStateUnknown && <p className="mt-1 text-[10px] text-amber-800 dark:text-amber-300">Charge status needs verification before this match can be changed or charged.</p>}
    </article>
  );
}

export default MatchBoardCard;
