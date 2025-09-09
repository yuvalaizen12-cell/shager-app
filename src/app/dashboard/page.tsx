"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

type Order = {
  id: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'online' | string;
  prepTimeMinutes: number;
  createdAt?: any; // Firestore Timestamp
  status: 'pending' | 'in-progress' | 'ready' | 'paid' | 'canceled' | string;
  assignedAt?: any | null;
  pickedUpAt?: any | null;
  deliveredAt?: any | null;
};

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [now, setNow] = useState<number>(Date.now());

  // טיקטוק פעם בשנייה — בשביל הספירה לאחור
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) {
      window.location.href = '/login';
      return;
    }

    // פרטי מסעדה
    getDoc(doc(db, 'restaurants', u.uid)).then((s) => setProfile(s.data()));

    // הזמנות של המסעדה
    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', u.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (s) => {
      const list = s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Order[];
      setOrders(list);
    });
    return () => unsub();
  }, []);

  // עזר: המרת Timestamp לתאריך JS
  function tsToDate(ts: any): Date | null {
    if (!ts) return null;
    if (typeof ts?.toDate === 'function') return ts.toDate();
    const d = new Date(ts);
    return isNaN(+d) ? null : d;
  }

  // תרגום אמצעי תשלום וסטטוס לעברית
  const paymentHeb = (m: string) =>
    ({ cash: 'מזומן', card: 'אשראי', online: 'אונליין' } as any)[m] || m;

  const statusHeb = (s: string) =>
    ({ pending: 'ממתין', 'in-progress': 'בתהליך', ready: 'מוכן', paid: 'שולם', canceled: 'בוטל' } as any)[s] || s;

  // חישוב טקסט/צבע של הספירה לאחור
  function timeLeft(o: Order) {
    if (o.status === 'ready') return { text: 'מוכן', cls: 'bg-emerald-700/50' };
    const created = tsToDate(o.createdAt);
    if (!created || !o.prepTimeMinutes) return { text: '-', cls: '' };

    const endAt = +created + o.prepTimeMinutes * 60_000;
    const diffSec = Math.floor((endAt - now) / 1000); // שניות
    const positive = diffSec >= 0;
    const abs = Math.abs(diffSec);
    const mm = Math.floor(abs / 60).toString().padStart(2, '0');
    const ss = Math.floor(abs % 60).toString().padStart(2, '0');
    const text = positive ? `${mm}:${ss}` : `+${mm}:${ss}`;
    const cls = positive ? 'bg-amber-700/50' : 'bg-rose-700/50';
    return { text, cls };
  }

  // פעולות
  async function markReady(orderId: string) {
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'ready',
      readyAt: serverTimestamp(),
    });
  }

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">שלום {profile?.businessName || ''}</h1>
          <p className="opacity-70">{profile?.businessAddress}</p>
        </div>

        <div className="flex gap-2">
          <Link className="inline-block px-4 py-2 rounded bg-green-600" href="/orders/new">
            הוספת משלוח חדש
          </Link>
          <button onClick={() => signOut(auth)} className="px-3 py-2 rounded bg-neutral-700">
            יציאה
          </button>
        </div>
      </div>

      <h2 className="text-xl mt-6 font-semibold">הזמנות</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="p-2">לקוח</th>
              <th className="p-2">כתובת</th>
              <th className="p-2">טלפון</th>
              <th className="p-2">סכום</th>
              <th className="p-2">תשלום</th>
              <th className="p-2">זמן</th>
              <th className="p-2">סטטוס</th>
              <th className="p-2">צוות</th>
              <th className="p-2">נלקח</th>
              <th className="p-2">נמסר</th>
              <th className="p-2">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const t = timeLeft(o);
              return (
                <tr key={o.id} className="border-t border-neutral-700">
                  <td className="p-2">{o.customerName}</td>
                  <td className="p-2">{o.customerAddress}</td>
                  <td className="p-2">{o.customerPhone}</td>
                  <td className="p-2">{o.amount}</td>
                  <td className="p-2">{paymentHeb(o.paymentMethod)}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded ${t.cls}`}>{t.text}</span>
                  </td>
                  <td className="p-2">{statusHeb(o.status)}</td>
                  <td className="p-2">{o.assignedAt ? '✓' : '—'}</td>
                  <td className="p-2">{o.pickedUpAt ? '✓' : '—'}</td>
                  <td className="p-2">{o.deliveredAt ? '✓' : '—'}</td>
                  <td className="p-2">
                    {o.status !== 'ready' && (
                      <button
                        onClick={() => markReady(o.id)}
                        className="px-2 py-1 rounded bg-blue-600"
                      >
                        סמן כמוכן
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td className="p-4 opacity-60" colSpan={11}>
                  אין הזמנות כרגע.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}




