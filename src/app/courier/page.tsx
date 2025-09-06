"use client";
import { useState } from "react";
import { InMemoryStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function CourierLogin() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const login = async () => {
    setErr(null);

    // ❗️ השם הנכון אחרי השדרוגים: authLoginCourier
    const u = await InMemoryStore.authLoginCourier(email.trim(), pw);

    if (!u) {
      setErr("אימייל או סיסמה שגויים");
      return;
    }

    // שמירה לניווט בהמשך
    localStorage.setItem("courierId", u.id);

    // נווטי לדף השליח (עדכני אם הנתיב אצלך אחר)
    router.push("/courier");
  };

  return (
    <main className="container mx-auto p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-6">התחברות שליח</h1>
      <div className="space-y-3">
        <input
          className="w-full rounded-xl border px-3 py-2 bg-white text-black ltr"
          placeholder="courier@example.com"
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
        <button
          onClick={login}
          className="rounded-2xl bg-black text-white px-4 py-2"
        >
          התחברות
        </button>
      </div>
    </main>
  );
}
