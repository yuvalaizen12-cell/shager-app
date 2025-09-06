'use client';
import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SignupPage() {
  const [f, setF] = useState({
    email: '',
    password: '',
    businessName: '',
    businessAddress: '',
    businessId: '',
    ownerName: '',
    ownerPhone: '',
  });
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // ✅ בדיקות סיסמה
    if (f.password.length < 6) {
      alert("הסיסמה חייבת להיות לפחות 6 תווים");
      setLoading(false);
      return;
    }
    if (f.password !== confirm) {
      alert("הסיסמאות לא תואמות");
      setLoading(false);
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, f.email, f.password);
      await setDoc(doc(db, 'restaurants', cred.user.uid), {
        ownerEmail: f.email,
        businessName: f.businessName,
        businessAddress: f.businessAddress,
        businessId: f.businessId,
        ownerName: f.ownerName,
        ownerPhone: f.ownerPhone,
        createdAt: serverTimestamp(),
        role: "restaurant", // נוסיף role לזיהוי
      });
      window.location.href = '/dashboard';
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-xl mx-auto space-y-3">
      <h1 className="text-2xl font-bold">יצירת משתמש למסעדה</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 rounded" placeholder="אימייל" type="email"
               value={f.email} onChange={e=>setF({...f,email:e.target.value})}/>
        <input className="w-full p-2 rounded" placeholder="סיסמה" type="password"
               value={f.password} onChange={e=>setF({...f,password:e.target.value})}/>
        <input className="w-full p-2 rounded" placeholder="אשר סיסמה" type="password"
               value={confirm} onChange={e=>setConfirm(e.target.value)}/>
        <input className="w-full p-2 rounded" placeholder="שם עסק"
               value={f.businessName} onChange={e=>setF({...f,businessName:e.target.value})}/>
        <input className="w-full p-2 rounded" placeholder="כתובת עסק"
               value={f.businessAddress} onChange={e=>setF({...f,businessAddress:e.target.value})}/>
        <input className="w-full p-2 rounded" placeholder="מס' עסק/עוסק"
               value={f.businessId} onChange={e=>setF({...f,businessId:e.target.value})}/>
        <div className="grid grid-cols-2 gap-3">
          <input className="p-2 rounded" placeholder="שם בעל העסק"
                 value={f.ownerName} onChange={e=>setF({...f,ownerName:e.target.value})}/>
          <input className="p-2 rounded" placeholder="טלפון בעל העסק"
                 value={f.ownerPhone} onChange={e=>setF({...f,ownerPhone:e.target.value})}/>
        </div>
        <button disabled={loading} className="px-4 py-2 rounded bg-blue-600">
          {loading ? 'יוצר…' : 'צור משתמש'}
        </button>
      </form>
    </main>
  );
}

