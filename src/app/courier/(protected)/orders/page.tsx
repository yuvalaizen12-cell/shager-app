"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

import { auth } from "@/lib/auth";
import { createOrder, listOrders, updateStatus /*, assignDriver */ } from '@/lib/orders';
import type { Order, OrderStatus } from '@/types/order';

function StatusBadge({ status }: { status: OrderStatus }) {
  const base = 'inline-block px-2 py-0.5 rounded text-xs font-medium';
  const cls =
    status === 'pending'
      ? 'bg-amber-900/40 text-amber-300 border border-amber-900/60'
      : status === 'in_progress'
      ? 'bg-blue-900/40 text-blue-300 border border-blue-900/60'
      : 'bg-emerald-900/40 text-emerald-300 border border-emerald-900/60';
  const label =
    status === 'pending' ? 'ממתין' : status === 'in_progress' ? 'בתהליך' : 'הושלם';
  return <span className={`${base} ${cls}`}>{label}</span>;
}

export default function AdminOrdersPage() {
  // מצב
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // טופס יצירה
  const [form, setForm] = useState({
    businessId: '',
    businessName: '',
    pickupAddress: '',
    dropoffAddress: '',
    contactName: '',
    contactPhone: '',
    cashOnDelivery: '',
    notes: '',
  });

  // טעינת הזמנות
  async function refresh() {
    setLoading(true);
    try {
      const data = await listOrders();
      setOrders(data);
    } catch (e: any) {
      console.error('listOrders failed:', e);
      alert('שגיאת Firestore בטעינת הזמנות: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  // התחברות אנונימית -> טעינה
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        try {
          await signInAnonymously(auth);
        } catch (err: any) {
          console.error('signInAnonymously failed:', err);
          alert('שגיאת התחברות: ' + (err?.message || err));
        }
      } else {
        await refresh();
      }
    });
    return unsub;
  }, []);

  // יצירת הזמנה
  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    try {
      await createOrder({
        businessId: form.businessId.trim(),
        businessName: form.businessName.trim(),
        pickupAddress: form.pickupAddress.trim(),
        dropoffAddress: form.dropoffAddress.trim(),
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        cashOnDelivery: form.cashOnDelivery.trim(),
        notes: form.notes.trim(),
      } as any);
      setForm({
        businessId: '',
        businessName: '',
        pickupAddress: '',
        dropoffAddress: '',
        contactName: '',
        contactPhone: '',
        cashOnDelivery: '',
        notes: '',
      });
      await refresh();
    } catch (err: any) {
      console.error('createOrder failed:', err);
      alert('שגיאה ביצירת הזמנה: ' + (err?.message || err));
    } finally {
      setCreating(false);
    }
  }

  // שינוי סטטוס
  async function quickStatus(orderId: string, status: OrderStatus) {
    if (!orderId) return;
    try {
      await updateStatus(orderId, status);
      await refresh();
    } catch (err: any) {
      console.error('updateStatus failed:', err);
      alert('שגיאה בעדכון סטטוס: ' + (err?.message || err));
    }
  }

  return (
    <main className="p-6 text-white max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Admin Dashboard — Orders</h1>

      {/* טופס יצירת משלוח */}
      <form onSubmit={onCreate} className="grid gap-3 max-w-xl">
        <input
          className="bg-neutral-800 p-2 rounded"
          placeholder="Business ID"
          value={form.businessId}
          onChange={(e) => setForm((s) => ({ ...s, businessId: e.target.value }))}
          required
        />
        <input
          className="bg-neutral-800 p-2 rounded"
          placeholder="Business Name"
          value={form.businessName}
          onChange={(e) => setForm((s) => ({ ...s, businessName: e.target.value }))}
          required
        />
        <input
          className="bg-neutral-800 p-2 rounded"
          placeholder="Pickup Address"
          value={form.pickupAddress}
          onChange={(e) => setForm((s) => ({ ...s, pickupAddress: e.target.value }))}
          required
        />
        <input
          className="bg-neutral-800 p-2 rounded"
          placeholder="Dropoff Address"
          value={form.dropoffAddress}
          onChange={(e) => setForm((s) => ({ ...s, dropoffAddress: e.target.value }))}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="bg-neutral-800 p-2 rounded"
            placeholder="Contact Name"
            value={form.contactName}
            onChange={(e) => setForm((s) => ({ ...s, contactName: e.target.value }))}
            required
          />
          <input
            className="bg-neutral-800 p-2 rounded"
            placeholder="Contact Phone"
            value={form.contactPhone}
            onChange={(e) => setForm((s) => ({ ...s, contactPhone: e.target.value }))}
            required
          />
        </div>
        <input
          className="bg-neutral-800 p-2 rounded"
          placeholder="Cash On Delivery (optional)"
          value={form.cashOnDelivery}
          onChange={(e) => setForm((s) => ({ ...s, cashOnDelivery: e.target.value }))}
        />
        <textarea
          className="bg-neutral-800 p-2 rounded"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 rounded px-4 py-2 font-medium disabled:opacity-60"
            disabled={creating}
          >
            {creating ? 'שומר...' : 'צור משלוח'}
          </button>
          <button
            type="button"
            onClick={refresh}
            className="bg-neutral-700 hover:bg-neutral-600 rounded px-4 py-2"
            disabled={loading}
          >
            רענן
          </button>
        </div>
      </form>

      {/* טבלת הזמנות */}
      <section className="mt-10">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-semibold">הזמנות</h2>
          {loading && <span className="opacity-70 text-sm">טוען...</span>}
        </div>

        {!loading && orders.length === 0 && <p className="opacity-70">אין הזמנות כרגע.</p>}

        {!loading && orders.length > 0 && (
          <div className="overflow-x-auto rounded border border-neutral-800">
            <table className="min-w-full text-sm">
              <thead className="text-left bg-neutral-900/40">
                <tr>
                  <th className="p-2">Business</th>
                  <th className="p-2">Pickup</th>
                  <th className="p-2">Dropoff</th>
                  <th className="p-2">Contact</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const orderId = (o as any).id || '';
                  const rowKey = orderId || `${o.businessId}-${o.createdAt}`;
                  const canStart = o.status === 'pending';
                  const canComplete = o.status === 'in_progress';

                  return (
                    <tr key={rowKey} className="border-t border-neutral-800">
                      <td className="p-2">{o.businessName}</td>
                      <td className="p-2">{o.pickupAddress}</td>
                      <td className="p-2">{o.dropoffAddress}</td>
                      <td className="p-2">{o.contactName}</td>
                      <td className="p-2">{o.contactPhone}</td>
                      <td className="p-2"><StatusBadge status={o.status} /></td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button
                            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            onClick={() => quickStatus(orderId, 'in_progress')}
                            disabled={!canStart}
                            title={canStart ? 'סמן כבתהליך' : 'לא זמין במצב הנוכחי'}
                          >
                            התחל
                          </button>
                          <button
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                            onClick={() => quickStatus(orderId, 'completed')}
                            disabled={!canComplete}
                            title={canComplete ? 'סמן כהושלם' : 'לא זמין במצב הנוכחי'}
                          >
                            השלם
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

