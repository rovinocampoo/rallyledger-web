import { apiFetch } from "./client";
import type { Payment, PaymentCorrection } from "../types/payment";

export type CreatePaymentInput = {
  participantId: number;
  amount: number;
  paymentMethod: string;
  reference: string | null;
  paymentDate: string;
};

export type CorrectPaymentInput = {
  amount: number;
  paymentMethod: string;
  reference: string | null;
  paymentDate: string;
  reason: string;
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

export function correctPayment(id: number, data: CorrectPaymentInput) {
  return apiFetch<Payment>(`/payments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getPaymentCorrections(id: number) {
  return apiFetch<PaymentCorrection[]>(`/payments/${id}/corrections`);
}
