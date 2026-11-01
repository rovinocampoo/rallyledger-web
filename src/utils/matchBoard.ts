import type { Match } from "../types/match";

export type MatchBoardCategory =
  | "IN_PROGRESS"
  | "SCHEDULED"
  | "COMPLETED"
  | "EXCEPTIONAL";

const COMPLETED_RESULTS = new Set([
  "TEAM_A_WIN",
  "TEAM_B_WIN",
  "DRAW",
  "WALKOVER_A",
  "WALKOVER_B",
  "ABANDONED",
]);

export function getMatchBoardCategory(match: Match): MatchBoardCategory {
  if (match.result === "IN_PROGRESS") return "IN_PROGRESS";
  if (match.result === "SCHEDULED") return "SCHEDULED";
  if (COMPLETED_RESULTS.has(match.result)) return "COMPLETED";
  return "EXCEPTIONAL";
}

export function getMatchBoardCounts(matches: Match[]) {
  return matches.reduce(
    (counts, match) => {
      counts[getMatchBoardCategory(match)] += 1;
      return counts;
    },
    { IN_PROGRESS: 0, SCHEDULED: 0, COMPLETED: 0, EXCEPTIONAL: 0 },
  );
}
