// functions/src/index.ts

// v2 https/onCall
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

// אתחול אדמין פעם אחת
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// הגדרות כלליות (השאירי כמו אצלך)
setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
  // memoryMiB: 256,
  // timeoutSeconds: 10,
});

/**
 * setUserRole – רק לאדמין: קובע role למשתמש ("admin" | "restaurant" | "courier")
 * data: { uid: string; role: "admin" | "restaurant" | "courier" }
 */
export const setUserRole = onCall(async (request) => {
  const caller = request.auth;
  if (!caller || caller.token.role !== "admin") {
    throw new HttpsError("permission-denied", "unauthorized: admin only");
  }

  const { uid, role } = request.data as {
    uid: string;
    role: "admin" | "restaurant" | "courier";
  };

  if (!uid || !["admin", "restaurant", "courier"].includes(role)) {
    throw new HttpsError("invalid-argument", "invalid-args");
  }

  await admin.auth().setCustomUserClaims(uid, { role });
  // אופציונלי: טריגר לרענון טוקן בלקוח
  await admin.firestore().doc(`_meta/forceRefresh/${uid}`).set({ t: Date.now() });

  return { ok: true };
});

/**
 * adminGeneratePasswordResetLink – רק לאדמין: מפיק לינק איפוס סיסמה למייל
 * data: { email: string }
 */
export const adminGeneratePasswordResetLink = onCall(async (request) => {
  const caller = request.auth;
  if (!caller || caller.token.role !== "admin") {
    throw new HttpsError("permission-denied", "unauthorized: admin only");
  }

  const { email } = request.data as { email: string };
  if (!email) throw new HttpsError("invalid-argument", "missing-email");

  const link = await getAuth().generatePasswordResetLink(email);
  return { link };
});

/**
 * assignOrder – שיוך הזמנה לשליח (אטומי בטרנזקציה)
 * data: { orderId: string; courierId: string }
 */
export const assignOrder = onCall(async (request) => {
  const caller = request.auth;
  if (!caller || caller.token.role !== "admin") {
    throw new HttpsError("permission-denied", "admin only");
  }

  const { orderId, courierId } = request.data as {
    orderId: string;
    courierId: string;
  };

  if (!orderId || !courierId) {
    throw new HttpsError("invalid-argument", "missing orderId/courierId");
  }

  const orderRef = db.collection("orders").doc(orderId);
  const courierRef = db.collection("couriers").doc(courierId);

  await db.runTransaction(async (tx) => {
    const [orderSnap, courierSnap] = await Promise.all([
      tx.get(orderRef),
      tx.get(courierRef),
    ]);

    if (!orderSnap.exists) throw new HttpsError("not-found", "order not found");
    if (!courierSnap.exists) throw new HttpsError("not-found", "courier not found");

    const order = orderSnap.data() as any;
    const courier = courierSnap.data() as any;

    if (order.status !== "pending" || order.courierId) {
      throw new HttpsError("failed-precondition", "order already assigned/unavailable");
    }
    if (courier.status !== "available" || courier.currentOrderId) {
      throw new HttpsError("failed-precondition", "courier not available");
    }

    tx.update(orderRef, {
      status: "assigned",
      courierId,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    tx.update(courierRef, {
      status: "busy",
      currentOrderId: orderId,
    });
  });

  return { ok: true };
});
