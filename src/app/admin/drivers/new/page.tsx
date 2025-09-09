"use client";
export const dynamic = "force-dynamic";
import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AdminNav from "@/components/AdminNav";

export default function NewDriverPage() {
  const [f, setF] = useState({ name:'', phone:'', email:'', password:'' });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      // רק אדמין מורשה
      const u = auth.currentUser;
      if (!u) { window.location.href = '/admin/login'; return; }
      const adminDoc = await getDoc(doc(db,'admins',u.uid));
      if (!adminDoc.exists()) { alert('אין הרשאות אדמין'); return; }

      const cred = await createUserWithEmailAndPassword(auth, f.email, f.password);
      await setDoc(doc(db,'drivers', cred.user.uid), {
        name: f.name, phone: f.phone, email: f.email, role: 'driver', createdBy: u.uid
      });
      alert('✅ נוצר שליח');
      window.location.href = '/admin';
    } catch (err:any) { alert(err.message); }
    finally { setLoading(false); }
  }

  return (
    <main className="p-6 max-w-md mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">יצירת שליח חדש</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
               placeholder="שם מלא" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
        <input className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
               placeholder="טלפון" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/>
        <input className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
               placeholder="אימייל" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/>
        <input className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
               placeholder="סיסמה" type="password" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/>
        <button disabled={loading} className="px-4 py-2 rounded bg-green-700">
          {loading ? 'יוצר…' : 'צור שליח'}
        </button>
      </form>
    </main>
  );
}
