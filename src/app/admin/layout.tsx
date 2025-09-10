// src/app/admin/layout.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientAuth } from "@/lib/auth";
import { getClientDb } from "@/lib/db";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const r = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let unsub: undefined | (() => void);

    (async () => {
      const auth = await getClientAuth();
      const db = await getClientDb();

      const { onAuthStateChanged } = await import("firebase/auth");
      const { doc, getDoc } = await import("firebase/firestore");

      unsub = onAuthStateChanged(auth, async (u) => {
        if (!u) return r.replace("/admin/login");
        const snap = await getDoc(doc(db, "admins", u.uid));
        if (!snap.exists()) return r.replace("/admin/login");
        setOk(true);
      });
    })();

    return () => { if (unsub) unsub(); };
  }, [r]);

  if (!ok) return null; // או ספינר קטן
  return <>{children}</>;
}
