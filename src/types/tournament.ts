export type TournamentStatus =
  | "DRAFT"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type Tournament = {
  id: number;
  organizationId: number;
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  status: TournamentStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateTournamentInput = {
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
};

export type TournamentDivisionCode =
  | "SINGLES_A"
  | "SINGLES_B"
  | "MENS_SINGLES"
  | "WOMENS_SINGLES"
  | "MENS_DOUBLES"
  | "WOMENS_DOUBLES"
  | "MIXED_DOUBLES";

export type TournamentDivision = {
  id: number;
  organizationId: number;
  tournamentId: number;
  code: TournamentDivisionCode;
  name: string;
  qualifyingEnabled: boolean;
  qualifyingSpots: number;
  createdAt: string;
  updatedAt: string;
};

export type TournamentEntryPlayer = {
  participantId: number;
  teamPosition: number;
  firstName: string;
  lastName: string;
  nickname: string;
};

export type TournamentEntry = {
  id: number;
  organizationId: number;
  tournamentId: number;
  divisionId: number;
  entryName: string;
  seed: number | null;
  entryStatus: "REGISTERED" | "WITHDRAWN" | "DISQUALIFIED" | "QUALIFIER";
  qualifyingEntry: boolean;
  playerIds?: number[];
  players?: TournamentEntryPlayer[];
  createdAt: string;
  updatedAt: string;
};

export type DrawType = "MAIN" | "QUALIFYING";

export type DraftMatchInput = {
  matchNumber: number;
  entryAId: number | null;
  entryBId: number | null;
};

export type UpdateDrawDraftInput = {
  matches: DraftMatchInput[];
};


export type CustomDrawMatchInput = {
  key: string;
  roundNumber: number;
  matchNumber: number;
  entryAId?: number | null;
  entryBId?: number | null;
  nextMatchKey?: string | null;
  nextSlot?: "A" | "B";
};

export type UpdateCustomDrawDraftInput = {
  matches: CustomDrawMatchInput[];
};

export type TournamentDrawEntrySummary = {
  id: number;
  entryName: string;
  seed?: number;
  players: TournamentEntryPlayer[];
};

export type TournamentMatch = {
  id: number;
  roundNumber: number;
  matchNumber: number;
  entryAId?: number;
  entryBId?: number;
  winnerEntryId?: number;
  nextMatchId?: number;
  nextSlot?: "A" | "B";
  courtId?: number;
  scheduledAt?: string;
  score: string;
  status:
    | "PENDING"
    | "SCHEDULED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "WALKOVER"
    | "BYE"
    | "CANCELLED";
  entryA?: TournamentDrawEntrySummary;
  entryB?: TournamentDrawEntrySummary;
  winner?: TournamentDrawEntrySummary;
};

export type TournamentDraw = {
  id: number;
  organizationId: number;
  divisionId: number;
  drawType: DrawType;
  drawSize: number;
  status: "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  matches: TournamentMatch[];
};

export type CreateDivisionInput = {
  code: TournamentDivisionCode;
  name: string;
  qualifyingEnabled: boolean;
  qualifyingSpots: number;
};

export type CreateEntryInput = {
  entryName: string;
  seed: number | null;
  entryStatus: "REGISTERED";
  qualifyingEntry: boolean;
  playerIds: number[];
};

export type RecordTournamentMatchResultInput = {
  winnerEntryId: number;
  score: string;
  walkover: boolean;
};
