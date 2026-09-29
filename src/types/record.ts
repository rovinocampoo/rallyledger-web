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
