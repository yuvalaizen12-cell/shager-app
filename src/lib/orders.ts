// src/lib/orders.ts
import { db, auth } from '@/lib/firebase';
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  getDocs,
  orderBy,
  query,
  doc,
  getDoc,
} from 'firebase/firestore';
import type { Order, OrderStatus } from '@/types/order';

const ORDERS = 'orders';

// ממיר Firestore Timestamp למילישניות
function tsToMillis(v: any): number | undefined {
  if (v?.toMillis) return v.toMillis();
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime();
  return undefined;
}

/** יצירת הזמנה חדשה */
export async function createOrder(
  input: Omit<Order, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy'>
): Promise<string> {
  const colRef = collection(db, ORDERS);
  const payload = {
    ...input,
    status: 'pending' as OrderStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid ?? null,
  };
  const ref = await addDoc(colRef, payload);
  return ref.id;
}

/** שליפת כל ההזמנות (מהחדש לישן) */
export async function listOrders(): Promise<Order[]> {
  const colRef = collection(db, ORDERS);
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as any;
    const item: Order = {
      id: d.id,
      ...data,
      createdAt: tsToMillis(data.createdAt) ?? Date.now(),
      updatedAt: tsToMillis(data.updatedAt),
    };
    return item;
  });
}

/** שליפת הזמנה לפי מזהה (אופציונלי, שימושי לדפי פרטים) */
export async function getOrder(orderId: string): Promise<Order | null> {
  const ref = doc(db, ORDERS, orderId);
  const s = await getDoc(ref);
  if (!s.exists()) return null;
  const data = s.data() as any;
  return {
    id: s.id,
    ...data,
    createdAt: tsToMillis(data.createdAt) ?? Date.now(),
    updatedAt: tsToMillis(data.updatedAt),
  } as Order;
}

/** שיוך שליח להזמנה */
export async function assignDriver(
  orderId: string,
  driverId: string,
  driverName?: string
): Promise<void> {
  const ref = doc(db, ORDERS, orderId);
  await updateDoc(ref, {
    driverId,
    driverName: driverName ?? null,
    updatedAt: serverTimestamp(),
  });
}

/** עדכון סטטוס הזמנה */
export async function updateStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const ref = doc(db, ORDERS, orderId);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
  });
}


