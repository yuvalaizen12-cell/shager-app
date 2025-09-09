// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  connectAuthEmulator,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";

// קונפיג של Firebase מה-.env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// ודא אתחול יחיד של האפליקציה


// יצירת מופעים
export const auth = getAuth(app);
export const db = getFirestore(app);

// התמדה: נשאר מחובר גם אחרי רענון/סגירה
setPersistence(auth, browserLocalPersistence).catch(() => {});

// שימוש באמולטורים בזמן פיתוח (כשיש דגל בסביבה)
if (process.env.NEXT_PUBLIC_USE_EMULATOR === "1") {
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  } catch {}
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  } catch {}
}




