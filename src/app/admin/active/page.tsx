"use client";

import AdminNav from "@/components/AdminNav";
import { useEffect, useState } from "react";
import { InMemoryStore, seedDemoData } from "@/lib/store";
import type { Courier, Order, Restaurant } from "@/lib/models";

// עזר: פורמט שעה ללא שניות (24h)
const fmtTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : "—";

// מיפוי סטטוס לצבע תגית
const statusPill = (s: Courier["status"]) => {
  if (s === "available") return "bg-green-200 text-green-900";
  if (s === "assigned") return "bg-yellow-200 text-yellow-900";
  return "bg-blue-200 text-blue-900"; // delivering
};

// מסדרים שליחים: פעילים בראש (delivering → assigned → available), ואז לפי שם
const sortCouriers = (a: Courier, b: Courier) => {
  const rank = (s: Courier["status"]) => (s === "delivering" ? 0 : s === "assigned" ? 1 : 2);
  const r = rank(a.status) - rank(b.status);
  return r !== 0 ? r : a.name.localeCompare(b.name, "he");
};

// נחשיב “משימה פעילה” רק assigned/picked_up
const isActiveOrder = (o: Order) => o.status === "assigned" || o.status === "picked_up";

export default function ActiveCouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [restaurantById, setRestaurantById] = useState<Record<string, Restaurant>>({});
  const [activeByCourier, setActiveByCourier] = useState<Record<string, Order[]>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadAll = async () => {
      const result = await Promise.all([
        InMemoryStore.listCouriers(),
        InMemoryStore.listRestaurants(),
        InMemoryStore.listOrders({ status: "assigned" }),
        InMemoryStore.listOrders({ status: "picked_up" }),
      ]);
      const [allCouriers, restaurants, assigned, pickedUp] = result as [
        Courier[],
        Restaurant[],
        Order[],
        Order[]
      ];

      // מפה: מסעדה לפי id
      const rmap = restaurants.reduce<Record<string, Restaurant>>((acc, r) => {
        acc[r.id] = r;
        return acc;
      }, {});

      // מפה: שליח → הזמנות פעילות (ממוינות לפי דדליין)
      const map: Record<string, Order[]> = {};
      for (const o of [...assigned, ...pickedUp]) {
        if (!o.assignedCourierId) continue;
        (map[o.assignedCourierId] ||= []).push(o);
      }
      for (const id of Object.keys(map)) {
        map[id].sort((a, b) => {
          const ta = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
          const tb = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
          return ta - tb;
        });
      }

      setCouriers(allCouriers.slice().sort(sortCouriers));
      setRestaurantById(rmap);
      setActiveByCourier(map);
    };

    const init = async () => {
      try {
        if (process.env.NODE_ENV !== "production") {
          await seedDemoData(); // יריץ דמו רק אם המאגר ריק
        }
        await loadAll();

        if (InMemoryStore.onOrdersSubscribe) {
          unsubscribe = InMemoryStore.onOrdersSubscribe(async () => {
            try {
              await loadAll();
            } catch {
              /* ignore once */
            }
          });
        }
      } catch (e: any) {
        setErrorMsg(e?.message || "שגיאה בטעינת הנתונים");
      }
    };

    init();
    return () => unsubscribe?.();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <AdminNav />
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">שליחים פעילים</h1>
      </header>

      {errorMsg && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-700">{errorMsg}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {couriers.map((c) => {
          const active = activeByCourier[c.id] || [];
          const first = active[0];
          const extraCount = Math.max(0, active.length - 1);

          // >>> כאן החלפנו את החץ ל-← (RTL: יעד ← איסוף)
          const currentTaskLine = first
            ? `משימה נוכחית: יעד: ${first.dropoffAddress} ← איסוף מ־${
                restaurantById[first.restaurantId]?.name ?? "—"
              } · דדליין ${fmtTime(first.dueAt)}`
            : "אין משימות פעילות";

          return (
            <div
              key={c.id}
              className="rounded-2xl border border-gray-400/40 p-5 bg-black/20 text-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-md text-sm ${statusPill(c.status)}`}
                >
                  {c.status}
                </span>
                <div className="text-right">
                  <div className="text-lg font-semibold">{c.name}</div>
                  {c.phone && <div className="text-sm text-blue-300">{c.phone}</div>}
                </div>
              </div>

              <div className="text-sm">
                <div className="font-medium">{currentTaskLine}</div>

                {/* אם יש יותר ממשימה אחת – נציג עד 2 נוספות ברשימה, גם כאן עם החץ ← */}
                {extraCount > 0 && (
                  <div className="mt-3 space-y-2">
                    {active.slice(1, 3).map((o) => (
                      <div key={o.id} className="text-xs text-gray-300">
                        • יעד: {o.dropoffAddress} ← איסוף מ־{restaurantById[o.restaurantId]?.name ?? "—"} · דדליין {fmtTime(o.dueAt)}
                      </div>
                    ))}
                    {active.length > 3 && (
                      <div className="text-xs text-gray-400">+{active.length - 3} משימות נוספות…</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
