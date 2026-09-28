export type Product = {
  id: number;
  organizationId: number;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
};
