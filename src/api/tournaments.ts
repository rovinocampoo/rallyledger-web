import { apiFetch } from "./client";
import type {
  CreateDivisionInput,
  CreateEntryInput,
  CreateTournamentInput,
  DrawType,
  RecordTournamentMatchResultInput,
  Tournament,
  TournamentDivision,
  TournamentDraw,
  TournamentEntry,
  TournamentMatch,
  UpdateDrawDraftInput,
  UpdateCustomDrawDraftInput,
} from "../types/tournament";

export async function getTournaments(): Promise<Tournament[]> {
  return apiFetch<Tournament[]>("/tournaments/");
}

export async function createTournament(
  input: CreateTournamentInput,
): Promise<Tournament> {
  return apiFetch<Tournament>("/tournaments/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getTournament(id: number): Promise<Tournament> {
  return apiFetch<Tournament>(`/tournaments/${id}`);
}

export async function getTournamentDivisions(
  tournamentId: number,
): Promise<TournamentDivision[]> {
  return apiFetch<TournamentDivision[]>(
    `/tournaments/${tournamentId}/divisions`,
  );
}

export async function createTournamentDivision(
  tournamentId: number,
  input: CreateDivisionInput,
): Promise<TournamentDivision> {
  return apiFetch<TournamentDivision>(
    `/tournaments/${tournamentId}/divisions`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export async function getTournamentEntries(
  tournamentId: number,
  divisionId: number,
): Promise<TournamentEntry[]> {
  return apiFetch<TournamentEntry[]>(
    `/tournaments/${tournamentId}/divisions/${divisionId}/entries`,
  );
}

export async function createTournamentEntry(
  tournamentId: number,
  divisionId: number,
  input: CreateEntryInput,
): Promise<TournamentEntry> {
  return apiFetch<TournamentEntry>(
    `/tournaments/${tournamentId}/divisions/${divisionId}/entries`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export async function getTournamentDraw(
  tournamentId: number,
  divisionId: number,
  drawType: DrawType,
): Promise<TournamentDraw> {
  return apiFetch<TournamentDraw>(
    `/tournaments/${tournamentId}/divisions/${divisionId}/draws/${drawType}`,
  );
}

export async function generateTournamentDraw(
  tournamentId: number,
  divisionId: number,
  drawType: DrawType,
): Promise<TournamentDraw> {
  return apiFetch<TournamentDraw>(
    `/tournaments/${tournamentId}/divisions/${divisionId}/draws/${drawType}`,
    { method: "POST" },
  );
}

export async function updateTournamentDrawDraft(
  tournamentId: number,
  divisionId: number,
  drawType: DrawType,
  input: UpdateDrawDraftInput,
): Promise<TournamentDraw> {
  return apiFetch<TournamentDraw>(
    `/tournaments/${tournamentId}/divisions/${divisionId}/draws/${drawType}/draft`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}

export async function updateCustomTournamentDrawDraft(
  tournamentId: number,
  divisionId: number,
  drawType: DrawType,
  input: UpdateCustomDrawDraftInput,
): Promise<TournamentDraw> {
  return apiFetch<TournamentDraw>(
    `/tournaments/${tournamentId}/divisions/${divisionId}/draws/${drawType}/draft/custom`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}

export async function publishTournamentDraw(
  tournamentId: number,
  divisionId: number,
  drawType: DrawType,
): Promise<TournamentDraw> {
  return apiFetch<TournamentDraw>(
    `/tournaments/${tournamentId}/divisions/${divisionId}/draws/${drawType}/publish`,
    {
      method: "POST",
    },
  );
}

export async function recordTournamentMatchResult(
  tournamentId: number,
  divisionId: number,
  drawType: DrawType,
  matchId: number,
  input: RecordTournamentMatchResultInput,
): Promise<TournamentMatch> {
  return apiFetch<TournamentMatch>(
    `/tournaments/${tournamentId}/divisions/${divisionId}/draws/${drawType}/matches/${matchId}/result`,
    { method: "PUT", body: JSON.stringify(input) },
  );
}
