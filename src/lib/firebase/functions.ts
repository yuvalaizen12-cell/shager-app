// web/src/lib/firebase/functions.ts
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

const REGION = "us-central1"; // כמו בהגדרות הפונקציות
const functions = getFunctions(getApp(), REGION);

export async function callSetUserRole(uid: string, role: "admin" | "restaurant" | "courier") {
  const fn = httpsCallable(functions, "setUserRole");
  const res = await fn({ uid, role });
  return res.data as { ok: boolean };
}

export async function callAdminGeneratePasswordResetLink(email: string) {
  const fn = httpsCallable(functions, "adminGeneratePasswordResetLink");
  const res = await fn({ email });
  return res.data as { link: string };
}

export async function callAssignOrder(orderId: string, courierId: string) {
  const fn = httpsCallable(functions, "assignOrder");
  const res = await fn({ orderId, courierId });
  return res.data as { ok: true };
}
