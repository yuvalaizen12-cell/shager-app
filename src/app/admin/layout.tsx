// src/app/admin/layout.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientAuth } from "@/lib/auth";
import { getClientDb } from "@/lib/db";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "allow" | "redirect">("checking");
  const r = useRouter();

  useEffect(() => {
    let unsub: undefined | (() => void);
    (async () => {
      try {
        const auth = await getClientAuth();
        const db = await getClientDb();
        const { onAuthStateChanged } = await import("firebase/auth");
        const { doc, getDoc } = await import("firebase/firestore");

        unsub = onAuthStateChanged(auth, async (u) => {
          if (!u) { setState("redirect"); r.replace("/admin/login"); return; }
          const snap = await getDoc(doc(db, "admins", u.uid));
          if (!snap.exists() || (snap.data() as any).role !== "admin") {
            setState("redirect"); r.replace("/admin/login"); return;
          }
          setState("allow");
        });
      } catch (e) {
        console.error("Auth check failed:", e);
        setState("redirect");
        r.replace("/admin/login");
      }
    })();
    return () => { if (unsub) unsub(); };
  }, [r]);

  if (state === "checking")  return <main className="p-6 text-center">בודק הרשאות…</main>;
  if (state === "redirect")  return <main className="p-6 text-center">מפנה להתחברות…</main>;
  return <>{children}</>;
}
