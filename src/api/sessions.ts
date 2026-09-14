import { apiFetch } from "./client";
import type { Session, SessionType, LightUsage  } from "../types/session";


export type CreateSessionInput = {
  name: string;
  description: string;
  sessionType: SessionType;
  sessionDate: string;
  startTime: string;
  endTime: string;
  maxPlayers: number | null;
  freeBalls: boolean;
  freeLights: boolean;
  lightUsage: LightUsage;
};

export function getSessions() {
  return apiFetch<Session[]>("/sessions");
}

export function createSession(data: CreateSessionInput) {
  return apiFetch<Session>("/sessions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateSession(id: number, data: CreateSessionInput) {
  return apiFetch<Session>(`/sessions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteSession(id: number) {
  return apiFetch<void>(`/sessions/${id}`, {
    method: "DELETE",
  });
}