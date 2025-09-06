'use client';
import { ReactNode, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => onAuthStateChanged(auth, () => setReady(true)), []);
  if (!ready) return <div className="p-6">טוען…</div>;
  return <>{children}</>;
}
