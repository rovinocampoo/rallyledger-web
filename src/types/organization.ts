export type Organization = {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationRole = "OWNER" | "ADMIN" | "COORDINATOR";
export type OrganizationAccess = {
  id: number;
  name: string;
  slug: string;
  role: OrganizationRole;
};
