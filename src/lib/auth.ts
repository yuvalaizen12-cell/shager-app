import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// שמור את קונפיג Firebase מהסביבה שלך
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let _auth: Auth | null = null;

export function getClientAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("getClientAuth() must be called in the browser");
  }
  if (_auth) return _auth;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  _auth = getAuth(app);
  return _auth;
}
