import { apiFetch } from "./client";
import type { CreateSaleInput, Sale } from "../types/sale";

export function getSales() {
  return apiFetch<Sale[]>("/sales");
}

export function createSale(data: CreateSaleInput) {
  return apiFetch<Sale>("/sales", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteSale(id: number) {
  return apiFetch<void>(`/sales/${id}`, {
    method: "DELETE",
  });
}
