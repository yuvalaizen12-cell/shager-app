"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav"; // או AdminNavLite אם זה השם אצלך
import { db } from "@/lib/db";

type Order = {
  id: string;
  restaurantName?: string;
  status?: string;
  createdAt?: any;
  dueAt?: any;
};

export default function OrdersPage() {
  console.log("✅ OrdersPage Loaded");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: undefined | (() => void);

    (async () => {
      try {
        const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

        unsub = onSnapshot(
          q,
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
            setOrders(list);
          },
          (err) => setError(err.message),
        );
      } catch (e: any) {
        setError(e.message ?? "Firestore load failed");
      }
    })();

    return () => { if (unsub) unsub(); };
  }, []);

  return (
    <main dir="rtl" className="p-4 space-y-4">
      <AdminNav />
      <h1 className="text-xl font-semibold">הזמנות</h1>

      {error && <div className="text-red-500">שגיאה: {error}</div>}
      {orders === null && !error && <div>טוען…</div>}
      {orders?.length === 0 && <div>אין הזמנות כרגע</div>}

      <ul className="space-y-2">
        {orders?.map((o) => (
          <li key={o.id} className="border rounded p-3">
            <div><b>ID:</b> {o.id}</div>
            <div><b>מסעדה:</b> {o.restaurantName ?? "-"}</div>
            <div><b>סטטוס:</b> {o.status ?? "-"}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
