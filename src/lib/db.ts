// src/lib/db.ts
import type { Firestore } from "firebase/firestore";
import { app } from "./firebaseApp";

let _db: Firestore | null = null;

export async function getClientDb(): Promise<Firestore> {
  if (typeof window === "undefined") {
    throw new Error("getClientDb must be called in the browser");
  }
  if (_db) return _db;

  const {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    CACHE_SIZE_UNLIMITED,
  } = await import("firebase/firestore");

  _db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    }),
  });

  return _db;
}
