"use client";
export const dynamic = "force-dynamic";
import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function CourierLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // וידוא תפקיד שליח
      const prof = await getDoc(doc(db, 'drivers', cred.user.uid));
      if (!prof.exists() || (prof.data() as any).role !== 'driver') {
        alert('המשתמש לא מוגדר כשליח.');
        return;
      }
      window.location.href = '/courier';
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-md mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">התחברות שליח</h1>
      <form onSubmit={login} className="space-y-3">
        <input
          className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
          placeholder="אימייל"
          type="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />
        <input
          className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
          placeholder="סיסמה"
          type="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />
        <button className="px-4 py-2 rounded bg-blue-600" disabled={loading}>
          {loading ? 'מתחבר…' : 'כניסה'}
        </button>
      </form>
      <p className="opacity-70 mt-3">אין לך משתמש? מנהל יוצר לך משתמש שליח (drivers) עם role=driver.</p>
    </main>
  );
}
