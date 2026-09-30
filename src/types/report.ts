export type ReportSummary = {
  participantCount: number;
  sessionCount: number;
  matchCount: number;
  totalCharges: number;
  totalPayments: number;
  outstandingBalance: number;
  sessionsByType: SessionTypeSummary[];
  matchTrend: MatchTrendPoint[];
};

export type OutstandingParticipant = {
  participantId: number;
  firstName: string;
  lastName: string;
  nickname: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
};

export type PaymentMethodSummary = {
  paymentMethod: string;
  paymentCount: number;
  totalAmount: number;
};

export type PaymentReport = {
  totalPayments: number;
  paymentCount: number;
  byMethod: PaymentMethodSummary[];
};

export type ChargeTypeSummary = {
  feeType: string;
  chargeCount: number;
  totalAmount: number;
};

export type AdjustmentSummary = {
  adjustmentCount: number;
  increaseAmount: number;
  decreaseAmount: number;
  netAmount: number;
};

export type FinancialReport = {
  totalCharges: number;
  totalPayments: number;
  netActivity: number;
  outstandingBalance: number;
  outstandingParticipantCount: number;
  creditBalance: number;
  creditParticipantCount: number;
  byPaymentMethod: PaymentMethodSummary[];
  byChargeType: ChargeTypeSummary[];
  adjustments: AdjustmentSummary;
  trend: FinancialTrendPoint[];
};

export type FinancialTrendPoint = {
  date: string;
  charges: number;
  payments: number;
};

export type SessionTypeSummary = {
  sessionType: string;
  sessionCount: number;
};

export type MatchTrendPoint = {
  date: string;
  matchCount: number;
};
