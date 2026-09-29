export type Sale = {
  id: number;
  organizationId: number;
  productId: number;
  productName: string;
  participantId: number | null;
  participantName: string | null;
  customerName: string | null;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  paymentStatus: "PAID" | "UNPAID";
  paymentMethod: "CASH" | "GCASH" | "MAYA" | "BANK_TRANSFER" | "CUSTOM" | null;
  reference: string | null;
  saleDate: string;
  chargeId: number | null;
  paymentId: number | null;
  createdAt: string;
};

export type CreateSaleInput = {
  buyerType: "PARTICIPANT" | "WALK_IN";
  participantId: number | null;
  customerName: string | null;
  productId: number;
  quantity: number;
  paymentStatus: "PAID" | "UNPAID";
  paymentMethod: "CASH" | "GCASH" | "MAYA" | "BANK_TRANSFER" | "CUSTOM" | null;
  reference: string | null;
  saleDate: string;
};
