import { apiFetch } from "./client";
import type { FeeRule, FeeRuleInput } from "../types/feeRule";

const FEE_RULES_PATH = "/fee-rules";

export function getFeeRules() {
  return apiFetch<FeeRule[]>(FEE_RULES_PATH);
}

export function createFeeRule(data: FeeRuleInput) {
  return apiFetch<FeeRule>(FEE_RULES_PATH, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateFeeRule(id: number, data: FeeRuleInput) {
  return apiFetch<FeeRule>(`${FEE_RULES_PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteFeeRule(id: number) {
  return apiFetch<void>(`${FEE_RULES_PATH}/${id}`, {
    method: "DELETE",
  });
}