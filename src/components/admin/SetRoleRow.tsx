// web/src/components/admin/SetRoleRow.tsx
"use client";

import { useState } from "react";
import { callSetUserRole } from "../../lib/firebase/functions";
import { reauthWithPassword } from "../../lib/firebase/reauth";

type Role = "admin" | "restaurant" | "courier";

export default function SetRoleRow({
  uid,
  currentRole,
}: {
  uid: string;
  currentRole?: Role;
}) {
  const [role, setRole] = useState<Role>(currentRole ?? "courier");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSave() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      if (!password) throw new Error("צריך להזין סיסמה לאימות");
      await reauthWithPassword(password); // אימות מנהל
      await callSetUserRole(uid, role);
      setMsg("עודכן בהצלחה");
    } catch (e: any) {
      setErr(e?.message ?? "שגיאה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className="border rounded px-2 py-1"
      >
        <option value="courier">שליח</option>
        <option value="restaurant">מסעדה</option>
        <option value="admin">מנהל</option>
      </select>

      <input
        type="password"
        placeholder="סיסמה לאימות מנהל"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded px-2 py-1"
      />

      <button
        onClick={onSave}
        disabled={busy}
        className="bg-blue-600 text-white rounded px-3 py-1 disabled:opacity-60"
      >
        {busy ? "שומר..." : "שמירה"}
      </button>

      {msg && <span className="text-green-700">{msg}</span>}
      {err && <span className="text-red-700">{err}</span>}
    </div>
  );
}
