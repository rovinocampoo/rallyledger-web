export type Payment = {
  id: number;
  participantId: number;
  amount: number;
  paymentMethod: string;
  reference: string | null;
  paymentDate: string;
  createdAt: string;
};

export type PaymentCorrection = {
  id: number;
  organizationId: number;
  paymentId: number;
  previousAmount: number;
  newAmount: number;
  previousPaymentMethod: string;
  newPaymentMethod: string;
  previousReference: string | null;
  newReference: string | null;
  previousPaymentDate: string;
  newPaymentDate: string;
  reason: string;
  correctedByAdminUserId: number;
  createdAt: string;
};

export type PaymentAllocation = {
  id: number;
  paymentId: number;
  chargeId: number;
  feeType: string;
  chargeDate: string;
  amount: number;
  allocationType: "ALLOCATE" | "RELEASE";
  createdAt: string;
};
