// src/lib/auth.ts
import type { Auth } from "firebase/auth";
import { app } from "./firebaseApp";

let _auth: Auth | null = null;

export async function getClientAuth(): Promise<Auth> {
  if (typeof window === "undefined") {
    throw new Error("getClientAuth must be called in the browser");
  }
  if (_auth) return _auth;

  const { getAuth, setPersistence, browserLocalPersistence } = await import("firebase/auth");
  _auth = getAuth(app);
  await setPersistence(_auth, browserLocalPersistence);
  return _auth;
}
