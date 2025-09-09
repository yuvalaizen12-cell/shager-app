"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { setUserRoleFn } from "@/lib/functions";

export default function SetRolePage() {
  const [uid, setUid] = useState("");
  const [role, setRole] = useState<"admin" | "restaurant" | "courier">("courier");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await setUserRoleFn({ uid, role });
      setMsg("Role נשמר בהצלחה");
    } catch (err: any) {
      setMsg(err?.message ?? "שגיאה בשמירת ה-Role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <h2>Set User Role</h2>
      <input
        placeholder="User UID"
        value={uid}
        onChange={(e) => setUid(e.target.value)}
        required
      />
      <select value={role} onChange={(e) => setRole(e.target.value as any)}>
        <option value="courier">courier</option>
        <option value="restaurant">restaurant</option>
        <option value="admin">admin</option>
      </select>
      <button disabled={loading}>{loading ? "שומר..." : "שמור Role"}</button>
      {msg && <div>{msg}</div>}
    </form>
  );
}
