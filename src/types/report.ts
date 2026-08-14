export type ReportSummary = {
  participantCount: number;
  sessionCount: number;
  matchCount: number;
  totalCharges: number;
  totalPayments: number;
  outstandingBalance: number;
};

export type OutstandingParticipant = {
  participantId: number;
  firstName: string;
  lastName: string;
  nickname: string;
  balance: number;
};