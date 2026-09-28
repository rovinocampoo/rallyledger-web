export type Charge = {
  id: number;
  participantId: number;
  sessionId: number;
  matchId: number | null;
  productId?: number | null;
  feeRuleId: number | null;
  feeType: string;
  amount: number;
  chargeDate: string;
  createdAt: string;
};
export type ChargeAdjustment = {
  id: number;
  organizationId: number;
  chargeId: number;
  previousAmount: number;
  newAmount: number;
  reason: string;
  adjustedByAdminUserId: number;
  createdAt: string;
};

export type UpdateChargeInput = {
  amount: number;
  reason: string;
};