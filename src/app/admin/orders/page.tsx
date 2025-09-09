"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { db } from "@/lib/db";

type Order = {
  id: string;
  restaurantName?: string;
  status?: string;
  createdAt?: any;
  dueAt?: any;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: undefined | (() => void);

    (async () => {
      try {
        // ייבוא דינמי – כדי לא למשוך Firestore ל-SSR
        const {
          collection,
          query,
          orderBy,
          onSnapshot,
        } = await import("firebase/firestore");

        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

        unsub = onSnapshot(
          q,
          (snap) => {
            const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
            setOrders(rows);
          },
          (err) => setError(err.message)
        );
      } catch (e: any) {
        setError(e.message ?? String(e));
      }
    })();

    return () => {
      try { unsub?.(); } catch {}
    };
  }, []);

  if (error) return <main dir="rtl" className="p-6">שגיאה: {error}</main>;
  if (!orders) return <main dir="rtl" className="p-6">טוען…</main>;

  return (
    <>
      <AdminNav />
      <main dir="rtl" className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">משלוחים לא משובצים</h1>

        {orders.length === 0 ? (
          <div className="text-sm text-gray-400">אין הזמנות.</div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id} className="rounded-2xl border border-white/15 p-4">
                <div className="text-xs text-gray-400">#{o.id}</div>
                <div className="font-medium">{o.restaurantName ?? "ללא שם"}</div>
                <div className="text-sm">{o.status ?? "לא ידוע"}</div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
