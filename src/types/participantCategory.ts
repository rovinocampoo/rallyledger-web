export type ParticipantCategory = {
  id: number;
  organizationId: number;
  code: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ParticipantCategoryInput = {
  name: string;
  code?: string;
  isActive: boolean;
};
