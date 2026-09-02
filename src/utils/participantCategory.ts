import type { ParticipantCategory } from "../types/participantCategory";
import { formatLabel } from "./format";

export function getParticipantCategoryLabel(
  categories: ParticipantCategory[],
  code: string | null,
) {
  if (!code) {
    return "Any participant";
  }

  return (
    categories.find((category) => category.code === code)?.name ??
    formatLabel(code)
  );
}
