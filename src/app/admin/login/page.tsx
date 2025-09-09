"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { auth } from "@/lib/auth";   // ← auth מגיע מהקליינט
import { db } from "@/lib/db";       // ← Firestore מהקליינט
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AdminNav from "@/components/AdminNav";


export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const adminDoc = await getDoc(doc(db, 'admins', cred.user.uid));
      if (!adminDoc.exists() || (adminDoc.data() as any).role !== 'admin') {
        alert('אין לך הרשאות אדמין.');
        return;
      }
      window.location.href = '/admin';
    } catch (err:any) {
      alert(err.message);
    } finally { setLoading(false); }
  }

  return (
    <main className="p-6 max-w-md mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">התחברות אדמין</h1>
      <form onSubmit={login} className="space-y-3">
        <input className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
               placeholder="אימייל" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
               placeholder="סיסמה" type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
        <button className="px-4 py-2 rounded bg-blue-600" disabled={loading}>
          {loading ? 'מתחבר…' : 'כניסה'}
        </button>
      </form>
    </main>
  );
}
