// src/components/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/auth";

type Role = "admin" | "restaurant" | "courier" | null;

type AuthState = {
  user: User | null;
  token: string | null;
  role: Role;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  role: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, token: null, role: null, loading: false });
        return;
      }
      const token = await user.getIdToken(true);
      const { claims } = await user.getIdTokenResult();
      const role = (claims.role as Role) ?? null;
      setState({ user, token, role, loading: false });
    });
    return () => unsub();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
