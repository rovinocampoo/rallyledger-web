export type FeeRule = {
  id: number;
  feeType: "BALL" | "COURT" | "LIGHT";
  participantType: string | null;
  matchType: string | null;
  amount: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type FeeRuleInput = {
  feeType: "BALL" | "COURT" | "LIGHT";
  participantType: string | null;
  matchType: string | null;
  amount: number;
  isActive: boolean;
};