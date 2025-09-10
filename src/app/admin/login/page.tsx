'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { getClientAuth } from '@/lib/auth';            // ה־auth מהקליינט (wrapper)
import { getClientDb } from '@/lib/db';                // ה־db מהקליינט (wrapper)
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // אם כבר מחוברת כאדמין — נווטי פנימה
  useEffect(() => {
    if (!loading && user && role === 'admin') {
      router.replace('/admin');
    }
  }, [user, role, loading, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const auth = getClientAuth();
      const db = getClientDb();

      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, 'admins', cred.user.uid));
      if (!snap.exists()) {
        alert('אין הרשאות אדמין');
        return;
      }
      // הצלחה
      router.replace('/admin');
    } catch (err: any) {
      alert(err.message ?? 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main dir="rtl" className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">התחברות אדמין</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
          placeholder="אימייל"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
          placeholder="סיסמה"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="px-4 py-2 rounded bg-blue-600" disabled={submitting}>
          {submitting ? 'מתחבר…' : 'כניסה'}
        </button>
      </form>
    </main>
  );
}
