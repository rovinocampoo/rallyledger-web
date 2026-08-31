export type Session = {
  id: number;
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
  createdAt: string;
  updatedAt: string;
};

export type SessionType =
  | "REGULAR_PLAY"
  | "TRAINING"
  | "OUTSIDER_PLAY"
  | "EVENT";

  export type LightUsage =
  | "NONE"
  | "HALF"
  | "FULL";