export type Session = {
  id: number;
  name: string;
  description: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  maxPlayers: number | null;
  freeBalls: boolean;
  freeLights: boolean;
  createdAt: string;
  updatedAt: string;
};