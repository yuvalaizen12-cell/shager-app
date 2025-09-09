"use client";
export const dynamic = "force-dynamic";

import { useState, type FormEvent } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db"; // וודאי שיש src/lib/db.ts כמו שהכנת
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function CourierLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // בדיקת פרופיל/תפקיד בשליחים
      const prof = await getDoc(doc(db, "drivers", cred.user.uid));
      if (!prof.exists() || (prof.data() as any).role !== "driver") {
        alert("המשתמש לא מוגדר כשליח.");
        return;
      }

      window.location.href = "/courier";
    } catch (e: any) {
      alert(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={login} style={{ maxWidth: 360, margin: "64px auto" }}>
      <h1>התחברות שליח</h1>
      <div style={{ marginBottom: 12 }}>
        <label>אימייל</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>סיסמה</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%" }}
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "מתחבר..." : "התחבר"}
      </button>
    </form>
  );
}
