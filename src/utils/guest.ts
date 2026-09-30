import type { Participant } from "../types/participant";
import { createParticipant } from "../api/participants";

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getParticipantNames(participant: Participant) {
  const fullName = [participant.firstName, participant.lastName]
    .filter(Boolean)
    .join(" ");

  return [
    normalizeName(fullName),
    participant.nickname ? normalizeName(participant.nickname) : "",
  ].filter(Boolean);
}

function findExistingGuest(name: string, participants: Participant[]) {
  const normalizedName = normalizeName(name);

  const matches = participants.filter((participant) =>
    getParticipantNames(participant).includes(normalizedName),
  );

  if (matches.length === 0) {
    return null;
  }

  // Prefer a reusable participant over a temporary occurrence.
  return matches.find((participant) => !participant.isTemporary) ?? matches[0];
}

export async function getOrCreateGuest(
  name: string,
  participants: Participant[],
) {
  const existing = findExistingGuest(name, participants);

  if (existing) {
    return existing;
  }

  return createParticipant({
    firstName: name,
    lastName: "",
    nickname: name,
    birthday: null,
    membershipStatus: "ACTIVE",
    participantType: "NONMEMBER",
    isTemporary: true,
  });
}
