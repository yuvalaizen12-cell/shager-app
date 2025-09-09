// src/lib/db.ts
"use client";
import { app } from "./firebase";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

export const db = getFirestore(app);

// אמולטור בזמן פיתוח בלבד
if (process.env.NEXT_PUBLIC_USE_EMULATOR === "1" && typeof window !== "undefined") {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  } catch {}
}
