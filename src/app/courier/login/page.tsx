"use client";
import { useState } from "react";
import { getClientAuth } from "@/lib/auth";            // ← במקום auth
import { signInWithEmailAndPassword } from "firebase/auth";

export default function CourierLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const auth = getClientAuth();                   // ← נקרא בצד לקוח
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/courier";
    } catch (err: any) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">התחברות שליח</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
               type="email" placeholder="אימייל"
               value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
               type="password" placeholder="סיסמה"
               value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="px-4 py-2 rounded bg-blue-600" disabled={loading}>
          {loading ? "מתחבר…" : "התחבר"}
        </button>
      </form>
    </main>
  );
}
