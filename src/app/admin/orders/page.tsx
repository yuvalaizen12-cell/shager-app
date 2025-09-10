"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getClientDb } from "@/lib/db";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: undefined | (() => void);
    (async () => {
      try {
        const db = await getClientDb();
        const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        unsub = onSnapshot(q, (snap) =>
          setOrders(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))),
          (err) => setError(err.message)
        );
      } catch (e:any) {
        setError(e.message ?? "Firestore load failed");
      }
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  return <main style={{padding:16}}>{error ?? (orders ? "טעון ✅" : "טוען…")}</main>;
}
