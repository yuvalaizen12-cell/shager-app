'use client';
import { useEffect, useMemo, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc, where, serverTimestamp
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Link from 'next/link';

type Driver = { id: string; name: string; phone: string; role: 'driver' };
type Order = {
  id: string;
  restaurantId: string;
  customerName: string; customerAddress: string; customerPhone: string;
  amount: number; paymentMethod: string;
  status: 'pending'|'ready'|'assigned'|'picked_up'|'delivered'|'canceled'|'paid'|string;
  createdAt?: any;
  assignedDriverId?: string|null; assignedAt?: any|null;
  pickedUpAt?: any|null; deliveredAt?: any|null;
};

export default function AdminDashboard() {
  const [ok, setOk] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [readyUnassigned, setReadyUnassigned] = useState<Order[]>([]);
  const [active, setActive] = useState<Order[]>([]); // assigned / picked_up
  const [now, setNow] = useState(Date.now());

  // וידוא הרשאת אדמין
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) { window.location.href = '/admin/login'; return; }
    getDoc(doc(db, 'admins', u.uid)).then(s => {
      if (!s.exists() || (s.data() as any).role !== 'admin') {
        window.location.href = '/admin/login'; return;
      }
      setOk(true);
    });
  }, []);

  useEffect(() => {
    const t = setInterval(()=>setNow(Date.now()), 1000);
    return ()=>clearInterval(t);
  }, []);

  // טען שליחים
  useEffect(() => {
    if (!ok) return;
    getDocs(query(collection(db,'drivers'), where('role','==','driver'))).then(s => {
      setDrivers(s.docs.map(d => ({ id:d.id, ...(d.data() as any) })));
    });
  }, [ok]);

  // הזמנות מוכנות ולא משויכות
  useEffect(() => {
    if (!ok) return;
    const q1 = query(
      collection(db,'orders'),
      where('status','==','ready'),
      where('assignedDriverId','==', null),
      orderBy('createdAt','desc')
    );
    const unsub1 = onSnapshot(q1, s => setReadyUnassigned(s.docs.map(d=>({id:d.id, ...(d.data() as any)}))));
    // משימות פעילות (שויכו/נאספוומחכות למסירה)
    const q2 = query(
      collection(db,'orders'),
      where('status','in',['assigned','picked_up']),
      orderBy('createdAt','desc')
    );
    const unsub2 = onSnapshot(q2, s => setActive(s.docs.map(d=>({id:d.id, ...(d.data() as any)}))));
    return ()=>{unsub1(); unsub2();};
  }, [ok]);

  function since(ts:any){
    if(!ts) return '-';
    const t = typeof ts.toDate==='function'? ts.toDate().getTime() : new Date(ts).getTime();
    const diff = Math.max(0, Math.floor((now - t)/1000));
    const mm = Math.floor(diff/60).toString().padStart(2,'0');
    const ss = Math.floor(diff%60).toString().padStart(2,'0');
    return `${mm}:${ss}`;
  }

  async function assign(orderId:string, driverId:string){
    await updateDoc(doc(db,'orders',orderId), {
      assignedDriverId: driverId,
      assignedAt: serverTimestamp(),
      status: 'assigned',
    });
  }
  async function markPicked(orderId:string){
    await updateDoc(doc(db,'orders',orderId), { pickedUpAt: serverTimestamp(), status:'picked_up' });
  }
  async function markDelivered(orderId:string){
    await updateDoc(doc(db,'orders',orderId), { deliveredAt: serverTimestamp(), status:'delivered' });
  }
  async function cancel(orderId:string){
    await updateDoc(doc(db,'orders',orderId), { status:'canceled' });
  }

  if (!ok) return null;

  return (
    <main className="p-6 space-y-8" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">דשבורד אדמין</h1>
        <div className="flex gap-2">
          <Link href="/admin/drivers/new" className="px-3 py-2 rounded bg-green-700">יצירת שליח</Link>
          <button onClick={()=>signOut(auth)} className="px-3 py-2 rounded bg-neutral-700">יציאה</button>
        </div>
      </div>

      {/* מוכנים ולא משויכים */}
      <section>
        <h2 className="text-xl font-semibold mb-2">מוכנים לשיוך</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr>
              <th className="p-2">לקוח</th>
              <th className="p-2">כתובת</th>
              <th className="p-2">טלפון</th>
              <th className="p-2">סכום</th>
              <th className="p-2">שיוך לשליח</th>
              <th className="p-2">בקרה</th>
            </tr></thead>
            <tbody>
              {readyUnassigned.map(o=>(
                <tr key={o.id} className="border-t border-neutral-700">
                  <td className="p-2">{o.customerName}</td>
                  <td className="p-2">{o.customerAddress}</td>
                  <td className="p-2">{o.customerPhone}</td>
                  <td className="p-2">{o.amount}</td>
                  <td className="p-2">
                    <select
                      className="p-2 rounded bg-black/90 text-white border border-white/20"
                      defaultValue=""
                      onChange={e=>{ if(e.target.value) assign(o.id, e.target.value); }}
                    >
                      <option value="" disabled>בחר שליח…</option>
                      {drivers.map(d=>(<option key={d.id} value={d.id}>{d.name} — {d.phone}</option>))}
                    </select>
                  </td>
                  <td className="p-2">
                    <button onClick={()=>cancel(o.id)} className="px-2 py-1 rounded bg-rose-700">בטל</button>
                  </td>
                </tr>
              ))}
              {readyUnassigned.length===0 && (
                <tr><td colSpan={6} className="p-3 opacity-60">אין כרגע משלוחים שמחכים לשיוך.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* פעילים */}
      <section>
        <h2 className="text-xl font-semibold mb-2">משימות פעילות</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr>
              <th className="p-2">לקוח</th>
              <th className="p-2">כתובת</th>
              <th className="p-2">טלפון</th>
              <th className="p-2">סכום</th>
              <th className="p-2">שליח</th>
              <th className="p-2">סטטוס</th>
              <th className="p-2">מאז שיוך</th>
              <th className="p-2">מאז איסוף</th>
              <th className="p-2">פעולות</th>
            </tr></thead>
            <tbody>
              {active.map(o=>{
                const driver = drivers.find(d=>d.id===o.assignedDriverId);
                return (
                  <tr key={o.id} className="border-t border-neutral-700">
                    <td className="p-2">{o.customerName}</td>
                    <td className="p-2">{o.customerAddress}</td>
                    <td className="p-2">{o.customerPhone}</td>
                    <td className="p-2">{o.amount}</td>
                    <td className="p-2">{driver ? `${driver.name} — ${driver.phone}` : '—'}</td>
                    <td className="p-2">{({assigned:'שויך', picked_up:'נאסף'} as any)[o.status] || o.status}</td>
                    <td className="p-2">{since(o.assignedAt)}</td>
                    <td className="p-2">{since(o.pickedUpAt)}</td>
                    <td className="p-2 flex gap-2">
                      {o.status==='assigned' && (
                        <button onClick={()=>markPicked(o.id)} className="px-2 py-1 rounded bg-amber-600">סומן נאסף</button>
                      )}
                      {o.status!=='delivered' && (
                        <button onClick={()=>markDelivered(o.id)} className="px-2 py-1 rounded bg-emerald-600">סומן נמסר</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {active.length===0 && (
                <tr><td colSpan={9} className="p-3 opacity-60">אין משימות פעילות כרגע.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
