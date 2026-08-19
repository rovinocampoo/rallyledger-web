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
  createdAt: string;
  updatedAt: string;
};

export type SessionType =
  | "REGULAR_PLAY"
  | "TRAINING"
  | "OUTSIDER_PLAY"
  | "EVENT";