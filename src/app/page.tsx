'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase'; 
export default function Home() {
  const [status, setStatus] = useState<'loading' | 'no-role'>('loading');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const snap = await getDoc(doc(db, 'users', user.uid));
      const role = snap.data()?.role as string | undefined;

      if (role === 'ADMIN') window.location.href = '/admin';
      else if (role === 'BUSINESS') window.location.href = '/business';
      else if (role === 'COURIER') window.location.href = '/courier';
      else setStatus('no-role');
    });

    return () => unsub();
  }, []);

  if (status === 'loading') return <div className="p-6">Loading…</div>;
  if (status === 'no-role') return <div className="p-6">User has no role</div>;
  return null;
}
