import { apiFetch } from "./client";
import type { Product, ProductInput } from "../types/product";
import type { Charge } from "../types/charge";

export function getProducts() {
  return apiFetch<Product[]>("/products");
}

export function createProduct(data: ProductInput) {
  return apiFetch<Product>("/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProduct(id: number, data: ProductInput) {
  return apiFetch<Product>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id: number) {
  return apiFetch<void>(`/products/${id}`, {
    method: "DELETE",
  });
}

export function chargeProductParticipant(
  productId: number,
  participantId: number,
) {
  return apiFetch<Charge>(`/products/${productId}/charges`, {
    method: "POST",
    body: JSON.stringify({ participantId }),
  });
}
