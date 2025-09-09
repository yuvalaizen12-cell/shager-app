"use client";
export const dynamic = "force-dynamic";
import AdminNav from "@/components/AdminNav";
import { useEffect, useState } from "react";
import { InMemoryStore } from "@/lib/store";
import { DailySummary, Restaurant } from "@/lib/models";

const todayISO = () => new Date().toISOString().slice(0,10);

export default function DailySummaryPage() {
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState<DailySummary[]>([]);
  const [restaurantsById, setById] = useState<Record<string, Restaurant>>({});

  const load = async () => {
    const [sum, restaurants] = await Promise.all([
      InMemoryStore.getDailySummary(date),
      InMemoryStore.listRestaurants()
    ]);
    const map: Record<string, Restaurant> = {};
    restaurants.forEach(r => map[r.id] = r);
    setById(map);
    setRows(sum);
  };
  useEffect(() => { load(); }, [date]);

  return (
    <>
      <AdminNav />
      <main className="container mx-auto p-6">
        <h1 className="text-xl font-bold mb-4">סיכום יומי</h1>
        <div className="mb-4">
          <label className="text-sm mr-2">תאריך:</label>
          <input type="date" className="border rounded px-2 py-1" value={date} onChange={e=>setDate(e.target.value)} />
        </div>

        {rows.map(row=>(
          <div key={row.restaurantId} className="border rounded-2xl p-4 mb-3">
            <div className="font-semibold">{restaurantsById[row.restaurantId]?.name ?? row.restaurantId}</div>
            <div className="text-sm text-gray-600">
              {row.ordersCount} משלוחים • סכום כולל ₪{row.totalRevenue.toFixed(0)}
            </div>
            <ul className="mt-2 text-sm list-disc pr-5">
              {row.orders.map(o=>(
                <li key={o.id}>#{o.id.slice(0,6)} — ₪{o.price} — ל: {o.dropoffAddress} — שליח: {o.courierName ?? "-"}</li>
              ))}
            </ul>
          </div>
        ))}
        {rows.length === 0 && <div className="text-gray-500">אין נתונים ליום שנבחר.</div>}
      </main>
    </>
  );
}
