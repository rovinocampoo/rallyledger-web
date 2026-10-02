import { neonAuth } from "../auth/neon";
import { apiFetch } from "./client";
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL is not configured");
}

export type PlayerMe = {
  id: number;
  organizationId: number;
  firstName: string;
  lastName: string;
  nickname?: string;
  birthday?: string;
  membershipStatus: string;
  participantType: string;
  isTemporary: boolean;
  profilePictureUrl?: string;
  authUserId: string;
};

export async function getPlayerMe(organizationId: number): Promise<PlayerMe> {
  const { data, error } = await neonAuth.getSession();

  if (error || !data?.session?.token) {
    throw new Error("Player is not authenticated");
  }

  const token = data.session.token;

  const response = await fetch(
    `${API_URL}/player/me?organizationId=${organizationId}`,
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

  return (await response.json()) as PlayerMe;
}

export type PlayerOrganization = {
  organizationId: number;
  organizationName: string;
  participantId: number;
};

export type PlayerInvitation = {
  id: number;
  organizationId: number;
  participantId: number;
  expiresAt: string;
  claimedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export async function getPlayerOrganizations(): Promise<PlayerOrganization[]> {
  const { data, error } = await neonAuth.getSession();

  if (error || !data?.session?.token) {
    throw new Error("Player is not authenticated");
  }

  const token = data.session.token;
  const response = await fetch(`${API_URL}/player/organizations`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.message || `Player API request failed (${response.status})`,
    );
  }

  return (await response.json()) as PlayerOrganization[];
}

export function getPlayerInvitation(token: string) {
  return apiFetch<PlayerInvitation>(
    `/player/invitations/${encodeURIComponent(token)}`,
  );
}

export async function claimPlayerInvitation(token: string) {
  const { data, error } = await neonAuth.getSession();

  if (error || !data?.session?.token) {
    throw new Error("Player is not authenticated");
  }

  const response = await fetch(
    `${API_URL}/player/invitations/${encodeURIComponent(token)}/claim`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${data.session.token}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.message || `Player invitation claim failed (${response.status})`,
    );
  }
}
