import { neonAuth } from "../auth/neon";
import type { ParticipantLedger } from "../types/ledger";
import type { Match } from "../types/match";
import type { MatchParticipant } from "../types/matchParticipant";
import type { MatchSet } from "../types/matchSet";
import type {
  PairRecord,
  PlayerRecord,
  RecordMatchHistory,
} from "../types/record";
import type { Session } from "../types/session";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL is not configured");
}

async function getPlayerToken() {
  const { data, error } = await neonAuth.getSession();

  if (error || !data?.session?.token) {
    throw new Error("Player is not authenticated");
  }

  return data.session.token;
}

async function playerMutation<T>(
  path: string,
  organizationId: number,
  method: "PUT" | "DELETE",
  body?: BodyInit,
): Promise<T> {
  const token = await getPlayerToken();

  const separator = path.includes("?") ? "&" : "?";

  const response = await fetch(
    `${API_URL}${path}${separator}organizationId=${organizationId}`,
    {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    },
  );

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
      };

      message = payload.message ?? payload.error ?? message;
    } catch {
      // Keep the HTTP status message when the response isn't JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

async function playerFetch<T>(
  path: string,
  organizationId: number,
): Promise<T> {
  const token = await getPlayerToken();

  const separator = path.includes("?") ? "&" : "?";

  const response = await fetch(
    `${API_URL}${path}${separator}organizationId=${organizationId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.message || `Player API request failed (${response.status})`,
    );
  }

  return (await response.json()) as T;
}

export type PlayerMatch = {
  match: Match;
  participants: MatchParticipant[];
  sets: MatchSet[];
};

export function getPlayerSessions(organizationId: number) {
  return playerFetch<Session[]>("/player/sessions", organizationId);
}

export function getPlayerMatches(organizationId: number) {
  return playerFetch<PlayerMatch[]>("/player/matches", organizationId);
}

export function getPlayerRecord(organizationId: number) {
  return playerFetch<PlayerRecord>("/player/records", organizationId);
}

export function getPlayerRecordMatches(organizationId: number) {
  return playerFetch<RecordMatchHistory[]>(
    "/player/records/matches",
    organizationId,
  );
}

export function getPlayerPairs(organizationId: number) {
  return playerFetch<PairRecord[]>("/player/pairs", organizationId);
}

export function getPlayerLedger(organizationId: number) {
  return playerFetch<ParticipantLedger>("/player/ledger", organizationId);
}

export function getPlayerUpcomingRegularPlay(orgID: number) {
  return playerFetch<Session[]>("/player/upcoming-regular-play", orgID);
}

export function uploadPlayerProfilePicture(
  organizationId: number,
  file: File,
) {
  const formData = new FormData();
  formData.append("photo", file);

  return playerMutation<{ success: boolean }>(
    "/player/profile-picture",
    organizationId,
    "PUT",
    formData,
  );
}

export function deletePlayerProfilePicture(
  organizationId: number,
) {
  return playerMutation<{ success: boolean }>(
    "/player/profile-picture",
    organizationId,
    "DELETE",
  );
}