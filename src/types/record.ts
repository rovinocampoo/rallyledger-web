export type PlayerRecord = {
  participantId: number;
  fullName: string;
  nickname: string;
  singlesMatches: number;
  singlesWins: number;
  singlesLosses: number;
  singlesDraws: number;
  doublesMatches: number;
  doublesWins: number;
  doublesLosses: number;
  doublesDraws: number;
  overallMatches: number;
  overallWins: number;
  overallLosses: number;
  overallDraws: number;
};

export type PairRecord = {
  participantOneId: number;
  participantOneName: string;
  participantTwoId: number;
  participantTwoName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
};

export type RecordMatchPlayer = {
  participantId: number;
  name: string;
  nickname: string | null;
  teamSide: "A" | "B";
};

export type RecordMatchHistory = {
  matchId: number;
  sessionId: number;
  sessionDate: string;
  matchType: string;
  result: "W" | "L" | "D";
  players: RecordMatchPlayer[];
};
