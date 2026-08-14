import { apiFetch } from "./client";
import type { Payment } from "../types/payment";

export type CreatePaymentInput = {
  participantId: number;
  amount: number;
  paymentMethod: string;
  reference: string | null;
  paymentDate: string;
};

export function createPayment(data: CreatePaymentInput) {
  return apiFetch<Payment>("/payments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deletePayment(id: number) {
  return apiFetch<void>(`/payments/${id}`, {
    method: "DELETE",
  });
}