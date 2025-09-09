"use client";
export const dynamic = "force-dynamic";
import AdminNav from "@/components/AdminNav";
import Toast from "@/components/Toast";
import { useEffect, useState } from "react";
import { InMemoryStore, seedDemoData } from "@/lib/store";
import type { Order, Courier, Restaurant } from "@/lib/models";

// ---- קבועים/עזר ----
const MAX_CONCURRENT = 5;

const minutesLeft = (dueAt?: string | null): number =>
  dueAt ? Math.round((new Date(dueAt).getTime() - Date.now()) / 60000) : Number.POSITIVE_INFINITY;

const urgencyBg = (mins: number) => {
  if (!isFinite(mins)) return "";
  if (mins <= 10) return "bg-red-200 text-black";
  if (mins <= 25) return "bg-yellow-200 text-black";
  return "bg-green-200 text-black";
};

const courierLabel = (c: Courier) => {
  const map: Record<Courier["status"], string> = {
    available: "פנוי",
    assigned: "משובץ",
    delivering: "במסירה",
  };
  return map[c.status] ?? c.status;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [restaurantById, setRestaurantById] = useState<Record<string, Restaurant>>({});
  const [activeByCourier, setActiveByCourier] = useState<Record<string, Order[]>>({});
  const [selectedCourierByOrder, setSelectedCourierByOrder] = useState<Record<string, string>>({});
  const [loadingAssign, setLoadingAssign] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // טוסטים – נעלמים אוטומטית
  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 3500);
    return () => clearTimeout(t);
  }, [errorMsg]);
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 2500);
    return () => clearTimeout(t);
  }, [successMsg]);

  const courierLoadText = (courierId: string) => {
    const active = activeByCourier[courierId] || [];
    const count = active.length;
    if (!count) return `0/${MAX_CONCURRENT} פעילים`;
    const addresses = active.slice(0, 2).map((o) => o.dropoffAddress).join(" | ");
    const extra = count > 2 ? ` +${count - 2}…` : "";
    return `${count}/${MAX_CONCURRENT} פעילים: ${addresses}${extra}`;
  };

  const courierLoadValues = (courierId: string) => {
    const count = activeByCourier[courierId]?.length ?? 0;
    const ratio = Math.min(1, count / MAX_CONCURRENT);
    const color = count >= 5 ? "bg-red-500" : count >= 3 ? "bg-yellow-500" : "bg-green-500";
    return { count, ratio, color };
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadAll = async () => {
      const result = await Promise.all([
        InMemoryStore.listOrders({ status: "unassigned" }),
        InMemoryStore.listCouriers(),
        InMemoryStore.listRestaurants(),
        InMemoryStore.listOrders({ status: "assigned" }),
        InMemoryStore.listOrders({ status: "picked_up" }),
      ]);
      const [unassigned, allCouriers, restaurants, assigned, pickedUp] =
        result as [Order[], Courier[], Restaurant[], Order[], Order[]];

      const rmap = restaurants.reduce<Record<string, Restaurant>>((acc, r) => {
        acc[r.id] = r;
        return acc;
      }, {});

      const sortedCouriers = allCouriers.slice().sort((a, b) => {
        const rank = (s: Courier["status"]) => (s === "available" ? 0 : s === "assigned" ? 1 : 2);
        const r = rank(a.status) - rank(b.status);
        return r !== 0 ? r : a.name.localeCompare(b.name, "he");
      });

      const map: Record<string, Order[]> = {};
      for (const o of [...assigned, ...pickedUp]) {
        if (!o.assignedCourierId) continue;
        (map[o.assignedCourierId] ||= []).push(o);
      }

      setOrders(unassigned);
      setCouriers(sortedCouriers);
      setRestaurantById(rmap);
      setActiveByCourier(map);
    };

    const init = async () => {
      try {
        if (process.env.NODE_ENV !== "production") await seedDemoData();
        await loadAll();
        if (InMemoryStore.onOrdersSubscribe) {
          unsubscribe = InMemoryStore.onOrdersSubscribe(async () => {
            try { await loadAll(); } catch {}
          });
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "שגיאה בטעינת הנתונים");
      }
    };

    init();
    return () => unsubscribe?.();
  }, []);

  const assign = async (orderId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const courierId = selectedCourierByOrder[orderId];
    if (!courierId) {
      setErrorMsg("בחר שליח לפני השידוך.");
      return;
    }
    const currentActive = activeByCourier[courierId]?.length || 0;
    if (currentActive >= MAX_CONCURRENT) {
      setErrorMsg(`אי אפשר לשדך – לשליח כבר יש ${MAX_CONCURRENT} משימות פעילות.`);
      return;
    }
    try {
      setLoadingAssign((s) => ({ ...s, [orderId]: true }));
      await InMemoryStore.assignOrder(orderId, courierId);
      setSuccessMsg("הזמנה שובצה לשליח בהצלחה.");
      setSelectedCourierByOrder((s) => {
        const c = { ...s };
        delete c[orderId];
        return c;
      });
    } catch (err: any) {
      setErrorMsg(err?.message || "שגיאה בשידוך ההזמנה");
    } finally {
      setLoadingAssign((s) => ({ ...s, [orderId]: false }));
    }
  };

  const unassignedCount = orders.length;

  return (
    <div className="p-4 space-y-6">
      <AdminNav />

      {/* טוסטים צפים */}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {errorMsg && <Toast kind="error" onClose={() => setErrorMsg(null)}>{errorMsg}</Toast>}
        {successMsg && <Toast kind="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Toast>}
      </div>

      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">הזמנות לא משובצות</h1>
        <div className="text-sm text-gray-300">סה״כ: {unassignedCount}</div>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-3 py-2 border font-semibold">#</th>
              <th className="px-3 py-2 border font-semibold">מסעדה</th>
              <th className="px-3 py-2 border font-semibold">איסוף</th>
              <th className="px-3 py-2 border font-semibold">מסירה</th>
              <th className="px-3 py-2 border font-semibold">דדליין</th>
              <th className="px-3 py-2 border font-semibold">דקות שנותרו</th>
              <th className="px-3 py-2 border font-semibold">בחר שליח</th>
              <th className="px-3 py-2 border font-semibold">פעולה</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, idx) => {
              const mins = minutesLeft(o.dueAt);
              const rowBg = urgencyBg(mins);
              const restName = restaurantById[o.restaurantId]?.name ?? o.restaurantId;
              const selectedId = selectedCourierByOrder[o.id];
              const { count, ratio, color } = courierLoadValues(selectedId || "");

              return (
                <tr key={o.id} className={rowBg}>
                  <td className="px-3 py-2 border">{idx + 1}</td>
                  <td className="px-3 py-2 border">{restName}</td>
                  <td className="px-3 py-2 border">{o.pickupAddress}</td>
                  <td className="px-3 py-2 border">{o.dropoffAddress}</td>
                  <td className="px-3 py-2 border">
                    {o.dueAt
                      ? new Date(o.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
                      : "—"}
                  </td>
                  <td className="px-3 py-2 border">
                    {isFinite(mins) ? (mins < 0 ? "עבר הדדליין" : mins) : "—"}
                  </td>
                  <td className="px-3 py-2 border">
                    <div className="flex flex-col gap-2 min-w-[420px]">
                      <select
                        className="border rounded p-1"
                        value={selectedId || ""}
                        onChange={(e) => setSelectedCourierByOrder((s) => ({ ...s, [o.id]: e.target.value }))}
                      >
                        <option value="">בחר…</option>
                        {couriers.map((c) => {
                          const activeCount = activeByCourier[c.id]?.length ?? 0;
                          return (
                            <option key={c.id} value={c.id}>
                              {c.name} · {courierLabel(c)} · {activeCount}/{MAX_CONCURRENT} פעילים
                              {activeCount ? ` · ${courierLoadText(c.id).split(" פעילים: ")[1] ?? ""}` : ""}
                            </option>
                          );
                        })}
                      </select>

                      {selectedId ? (
                        <div className="flex items-center gap-3">
                          <div className="w-48 h-2 rounded bg-gray-200 overflow-hidden" aria-label="מד עומס לשליח">
                            <div
                              className={`h-full ${color}`}
                              style={{ width: `${ratio * 100}%` }}
                              aria-valuenow={count}
                              aria-valuemin={0}
                              aria-valuemax={MAX_CONCURRENT}
                              role="progressbar"
                            />
                          </div>
                          <div className="text-xs text-gray-700">
                            עומס: {count}/{MAX_CONCURRENT} · {courierLabel(couriers.find((c) => c.id === selectedId)!)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600">בחר שליח להצגת עומס וכתובות פעילות</div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 border">
                    <button
                      className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                      disabled={!!loadingAssign[o.id]}
                      onClick={() => assign(o.id)}
                    >
                      {loadingAssign[o.id] ? "משדך…" : "שדך"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  אין הזמנות לא משובצות כרגע.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
