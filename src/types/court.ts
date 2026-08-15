export type Court = {
  id: number;
  name: string;
  location: string;
  surface: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CourtInput = Omit<
  Court,
  "id" | "createdAt" | "updatedAt"
>;