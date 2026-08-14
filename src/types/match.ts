export type MatchStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "TEAM_A_WIN"
  | "TEAM_B_WIN"
  | "DRAW"
  | "WALKOVER_A"
  | "WALKOVER_B"
  | "CANCELLED"
  | "POSTPONED"
  | "ABANDONED";

export type Match = {
  id: number;
  sessionId: number;
  courtId: number;
  matchType: string;
  result: MatchStatus;
  lightsOn: boolean;
  createdAt: string;
  updatedAt: string;
};