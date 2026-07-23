import { createContext } from "react";

import type { User } from "../types/user";

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const AuthContext =
  createContext<AuthContextValue | undefined>(undefined);