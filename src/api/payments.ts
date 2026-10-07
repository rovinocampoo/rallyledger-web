import { apiFetch } from "./client";
import type {
  Payment,
  PaymentAllocation,
  PaymentCorrection,
} from "../types/payment";

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
export type ReversePaymentInput = {
  reason: string;
};

export function reversePayment(id: number, data: ReversePaymentInput) {
  return apiFetch<Payment>(`/payments/${id}/reverse`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getPaymentAllocations(id: number) {
  return apiFetch<PaymentAllocation[]>(`/payments/${id}/allocations`);
}
