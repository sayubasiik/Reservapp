export type UserRole = "customer" | "business_owner";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}