// src/lib/auth.ts
"use client";
import { app } from "./firebase";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  connectAuthEmulator,
} from "firebase/auth";

export const auth = getAuth(app);

// השארת משתמש מחובר (לא לחסום שגיאות)
void setPersistence(auth, browserLocalPersistence).catch(() => {});

// אמולטור בזמן פיתוח בלבד
if (process.env.NEXT_PUBLIC_USE_EMULATOR === "1" && typeof window !== "undefined") {
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  } catch {}
}
