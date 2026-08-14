import type { Charge } from "./charge";
import type { Payment } from "./payment";

export type ParticipantLedger = {
  participantId: number;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  charges: Charge[];
  payments: Payment[];
};