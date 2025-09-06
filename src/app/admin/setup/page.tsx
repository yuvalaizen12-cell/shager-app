'use client';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import AdminNav from "@/components/AdminNav";


export default function AdminSetup() {
  const [msg, setMsg] = useState('');

  async function makeMeAdmin() {
    const u = auth.currentUser;
    if (!u) { setMsg('צריך להיות מחוברים'); return; }
    try {
      await setDoc(doc(db, 'admins', u.uid), {
        role: 'admin',
        email: u.email ?? null,
        createdAt: new Date().toISOString(),
      }, { merge: true });
      setMsg('✅ המשתמש סומן כאדמין. אפשר לחזור ל־/admin');
    } catch (e:any) {
      setMsg('שגיאה: ' + e.message);
    }
  }

  return (
    <main className="p-6 max-w-md mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">הפוך אותי לאדמין (זמני)</h1>
      <p className="opacity-70 mb-3">
        התחברי עם החשבון של דוד → לחצי על הכפתור כדי ליצור מסמך בקולקציית <code>admins</code>.
        אחר כך מומלץ למחוק את הדף הזה מהקוד.
      </p>
      <button onClick={makeMeAdmin} className="px-4 py-2 rounded bg-green-600">הפוך אותי לאדמין</button>
      {msg && <p className="mt-3">{msg}</p>}
    </main>
  );
}
