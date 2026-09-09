export type PackageBillingMode = "EQUAL" | "SINGLE";

export type PackageParticipant = {
  packageId: number;
  participantId: number;
};

export type PackageDetails = {
  id: number;
  organizationId: number;
  sessionId: number;
  amount: number;
  billingMode: PackageBillingMode;
  payerParticipantId: number | null;
  courtWaived: boolean;
  createdAt: string;
  updatedAt: string;
  participants: PackageParticipant[];
};

export type CreatePackageInput = {
  sessionId: number;
  participantIds: number[];
  amount: number;
  billingMode: PackageBillingMode;
  payerParticipantId: number | null;
};