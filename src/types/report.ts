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