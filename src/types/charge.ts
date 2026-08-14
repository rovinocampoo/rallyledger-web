export type Charge = {
  id: number;
  participantId: number;
  sessionId: number;
  matchId: number | null;
  feeRuleId: number | null;
  feeType: string;
  amount: number;
  chargeDate: string;
  createdAt: string;
};