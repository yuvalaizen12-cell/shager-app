// src/app/admin/login/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { getClientAuth } from "@/lib/auth";
import { getClientDb }   from "@/lib/db";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr(null);
    try {
      const auth = await getClientAuth();
      const db   = await getClientDb();
      const { signInWithEmailAndPassword, signOut } = await import("firebase/auth");
      const { doc, getDoc } = await import("firebase/firestore");

      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "admins", cred.user.uid));
      if (!snap.exists() || (snap.data() as any).role !== "admin") {
        await signOut(auth);
        setErr("אין לך הרשאות אדמין."); return;
      }
      location.href = "/admin";
    } catch (e:any) {
      setErr(e?.message ?? "שגיאת התחברות");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto bg-neutral-900 text-white" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">התחברות אדמין</h1>
      <form onSubmit={login} className="space-y-3">
        <input className="w-full p-2 rounded bg-black/60 border border-white/20 text-right"
               placeholder="אימייל" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full p-2 rounded bg-black/60 border border-white/20 text-right"
               placeholder="סיסמה" type="password" value={password} onChange={e=>setPw(e.target.value)} />
        {err && <div className="text-red-400 text-sm">{err}</div>}
        <button className="px-4 py-2 rounded bg-blue-600" disabled={loading}>
          {loading ? "מתחבר…" : "כניסה"}
        </button>
      </form>
    </main>
  );
}
