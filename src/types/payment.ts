export type Payment = {
  id: number;
  participantId: number;
  amount: number;
  paymentMethod: string;
  reference: string | null;
  paymentDate: string;
  createdAt: string;
};