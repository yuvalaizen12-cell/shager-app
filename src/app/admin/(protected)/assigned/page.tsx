"use client";
export const dynamic = "force-dynamic";
import AdminNav from "@/components/AdminNav";
import Toast from "@/components/Toast";
import { useEffect, useState } from "react";
import { InMemoryStore, seedDemoData } from "@/lib/store";
import type { Order, Courier, Restaurant } from "@/lib/models";

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

export default function AssignedOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [restaurantById, setRestaurantById] = useState<Record<string, Restaurant>>({});
  const [activeByCourier, setActiveByCourier] = useState<Record<string, Order[]>>({});
  const [selectedCourierByOrder, setSelectedCourierByOrder] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // טיימרים להעלמת ההודעות
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

  const loadAll = async () => {
    const result = await Promise.all([
      InMemoryStore.listOrders({ status: "assigned" }),
      InMemoryStore.listOrders({ status: "picked_up" }),
      InMemoryStore.listCouriers(),
      InMemoryStore.listRestaurants(),
    ]);
    const [assigned, picked, allCouriers, restaurants] =
      result as [Order[], Order[], Courier[], Restaurant[]];

    const rmap = restaurants.reduce<Record<string, Restaurant>>((acc, r) => {
      acc[r.id] = r; return acc;
    }, {});

    const sortedCouriers = allCouriers.slice().sort((a, b) => {
      const rank = (s: Courier["status"]) => (s === "available" ? 0 : s === "assigned" ? 1 : 2);
      const r = rank(a.status) - rank(b.status);
      return r !== 0 ? r : a.name.localeCompare(b.name, "he");
    });

    const allActive = [...assigned, ...picked].sort((a, b) => {
      const ta = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
      return ta - tb;
    });

    const activeMap: Record<string, Order[]> = {};
    for (const o of allActive) {
      const cid = o.assignedCourierId;
      if (!cid) continue;
      (activeMap[cid] ||= []).push(o);
    }

    setRestaurantById(rmap);
    setCouriers(sortedCouriers);
    setOrders(allActive);
    setActiveByCourier(activeMap);
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const init = async () => {
      try {
        if (process.env.NODE_ENV !== "production") await seedDemoData();
        await loadAll();
        if (InMemoryStore.onOrdersSubscribe) {
          unsub = InMemoryStore.onOrdersSubscribe(async () => { await loadAll(); });
        }
      } catch (e: any) {
        setErrorMsg(e?.message || "שגיאה בטעינת הנתונים");
      }
    };
    init();
    return () => unsub?.();
  }, []);

  const reassign = async (orderId: string) => {
    const courierId = selectedCourierByOrder[orderId];
    if (!courierId) {
      setErrorMsg("בחר שליח חדש לפני החלפה.");
      return;
    }
    try {
      setLoading((s) => ({ ...s, [orderId]: true }));
      await InMemoryStore.reassignOrder(orderId, courierId);
      setSuccessMsg("השיבוץ הוחלף בהצלחה.");
      setSelectedCourierByOrder((s) => { const c = { ...s }; delete c[orderId]; return c; });
    } catch (e: any) {
      setErrorMsg(e?.message || "שגיאה בהחלפת השיבוץ");
    } finally {
      setLoading((s) => ({ ...s, [orderId]: false }));
    }
  };

  const cancel = async (orderId: string) => {
    if (!confirm("לבטל את ההזמנה הזו?")) return;
    try {
      setLoading((s) => ({ ...s, [orderId]: true }));
      await InMemoryStore.cancelOrder(orderId);
      setSuccessMsg("ההזמנה בוטלה.");
    } catch (e: any) {
      setErrorMsg(e?.message || "שגיאה בביטול");
    } finally {
      setLoading((s) => ({ ...s, [orderId]: false }));
    }
  };

  const courierLoadText = (courierId: string) => {
    const arr = activeByCourier[courierId] || [];
    const count = arr.length;
    if (!count) return `0/${MAX_CONCURRENT} פעילים`;
    const addresses = arr.slice(0, 2).map((o) => o.dropoffAddress).join(" | ");
    const extra = count > 2 ? ` +${count - 2}…` : "";
    return `${count}/${MAX_CONCURRENT} פעילים: ${addresses}${extra}`;
  };

  return (
    <div className="p-4 space-y-6">
      <AdminNav />

      {/* טוסטים צפים */}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {errorMsg && <Toast kind="error" onClose={() => setErrorMsg(null)}>{errorMsg}</Toast>}
        {successMsg && <Toast kind="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Toast>}
      </div>

      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">משלוחים משובצים</h1>
        <div className="text-sm text-gray-300">סה״כ: {orders.length}</div>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-3 py-2 border font-semibold">#</th>
              <th className="px-3 py-2 border font-semibold">סטטוס</th>
              <th className="px-3 py-2 border font-semibold">מסעדה</th>
              <th className="px-3 py-2 border font-semibold">איסוף</th>
              <th className="px-3 py-2 border font-semibold">יעד</th>
              <th className="px-3 py-2 border font-semibold">דדליין</th>
              <th className="px-3 py-2 border font-semibold">דקות שנותרו</th>
              <th className="px-3 py-2 border font-semibold">שליח נוכחי</th>
              <th className="px-3 py-2 border font-semibold">החלפת שליח</th>
              <th className="px-3 py-2 border font-semibold">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, idx) => {
              const mins = minutesLeft(o.dueAt);
              const rowBg = urgencyBg(mins);
              const restName = restaurantById[o.restaurantId]?.name ?? o.restaurantId;
              const currentCourier = couriers.find((c) => c.id === o.assignedCourierId);

              return (
                <tr key={o.id} className={rowBg}>
                  <td className="px-3 py-2 border">{idx + 1}</td>
                  <td className="px-3 py-2 border">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      o.status === "picked_up" ? "bg-blue-200 text-blue-900" : "bg-yellow-200 text-yellow-900"
                    }`}>{o.status}</span>
                  </td>
                  <td className="px-3 py-2 border">{restName}</td>
                  <td className="px-3 py-2 border">{o.pickupAddress}</td>
                  <td className="px-3 py-2 border">{o.dropoffAddress}</td>
                  <td className="px-3 py-2 border">
                    {o.dueAt ? new Date(o.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : "—"}
                  </td>
                  <td className="px-3 py-2 border">{isFinite(mins) ? (mins < 0 ? "עבר הדדליין" : mins) : "—"}</td>
                  <td className="px-3 py-2 border">
                    {currentCourier
                      ? `${currentCourier.name} · ${courierLabel(currentCourier)} · ${(activeByCourier[currentCourier.id]?.length ?? 0)}/${MAX_CONCURRENT}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 border">
                    <select
                      className="border rounded p-1 max-w-[360px]"
                      value={selectedCourierByOrder[o.id] || ""}
                      onChange={(e) => setSelectedCourierByOrder((s) => ({ ...s, [o.id]: e.target.value }))}
                    >
                      <option value="">בחר שליח…</option>
                      {couriers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · {courierLabel(c)} · {(activeByCourier[c.id]?.length ?? 0)}/{MAX_CONCURRENT} · {courierLoadText(c.id)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 border">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-50"
                        disabled={!!loading[o.id]}
                        onClick={() => reassign(o.id)}
                      >
                        {loading[o.id] ? "מחליף…" : "החלף שליח"}
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                        disabled={!!loading[o.id]}
                        onClick={() => cancel(o.id)}
                      >
                        בטל
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {orders.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-gray-500">
                  אין משלוחים משובצים כרגע.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


