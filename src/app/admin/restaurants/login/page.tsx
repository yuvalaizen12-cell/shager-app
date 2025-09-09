"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { InMemoryStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function RestaurantLogin() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const login = async () => {
    setErr(null);
    const r = await InMemoryStore.authLoginRestaurant(email.trim(), pw);
    if (!r) {
      setErr("אימייל או סיסמה שגויים");
      return;
    }
    localStorage.setItem("restaurantId", r.id);
    router.push("/dashboard"); // דף ההזמנות
  };

  return (
    <main className="container mx-auto p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-6">התחברות מסעדה</h1>
      <div className="space-y-3">
        <input
          className="w-full rounded-xl border px-3 py-2 bg-white text-black ltr"
          placeholder="owner@restaurant.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full rounded-xl border px-3 py-2 bg-white text-black"
          placeholder="סיסמה"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        {err && <div className="text-red-500 text-sm">{err}</div>}
        <button onClick={login} className="rounded-2xl bg-black text-white px-4 py-2">
          התחברות
        </button>
      </div>
    </main>
  );
}
