// src/lib/functions.ts
"use client";

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

export const functions = getFunctions(app, "us-central1");

// עטיפות נוחות
export const setUserRoleFn = httpsCallable(functions, "setUserRole");
export const resetPasswordLinkFn = httpsCallable(functions, "adminGeneratePasswordResetLink");
export const assignOrderFn = httpsCallable(functions, "assignOrder");
