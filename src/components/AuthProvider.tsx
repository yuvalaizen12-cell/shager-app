'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getClientAuth } from '@/lib/auth';
import { getClientDb } from '@/lib/db';
import { doc, getDoc } from 'firebase/firestore';

// תפקיד המשתמש במערכת
type Role = 'admin' | 'courier' | 'restaurant' | null;

type AuthCtx = {
  user: User | null;
  role: Role;
  loading: boolean;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  role: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthCtx>({
    user: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const auth = getClientAuth();
    const db = getClientDb();

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setState({ user: null, role: null, loading: false });
        return;
      }

      // בדיקת תפקיד: קודם admins/{uid}, אחרת users/{uid}.role
      let role: Role = null;

      const adminSnap = await getDoc(doc(db, 'admins', u.uid));
      if (adminSnap.exists()) {
        role = 'admin';
      } else {
        const userSnap = await getDoc(doc(db, 'users', u.uid));
        if (userSnap.exists()) role = (userSnap.data() as any).role ?? null;
      }

      setState({ user: u, role, loading: false });
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
