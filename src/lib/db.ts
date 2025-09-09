// src/lib/db.ts
"use client";
import { getFirestore } from "firebase/firestore";
import { app } from "./firebase";
export const db = getFirestore(app);
