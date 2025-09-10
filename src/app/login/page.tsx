"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "@/lib/auth";   // ⟵ במקום `auth`

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const auth = getClientAuth(); // ⟵ מקבלים Auth בצד הקליינט
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/dashboard"; // או יעד אחר בהתאם לאפליקציה
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-md mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      <form onSubmit={login} className="space-y-3">
        <input
          className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
          type="email"
          placeholder="אימייל"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}  // טיפוס תקין
        />
        <input
          className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)} // טיפוס תקין
        />
        <button className="px-4 py-2 rounded bg-blue-600" disabled={loading}>
          {loading ? "מתחבר…" : "כניסה"}
        </button>
      </form>
    </main>
  );
}
