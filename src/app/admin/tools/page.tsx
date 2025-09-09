"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import AdminNav from "@/components/AdminNav";
import { setUserRoleFn, resetPasswordLinkFn } from "@/lib/functions";

export default function AdminTools() {
  // Reset Password
  const [email, setEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [resetErr, setResetErr] = useState<string | null>(null);

  async function onMakeResetLink(e: React.FormEvent) {
    e.preventDefault();
    setResetErr(null);
    setResetLoading(true);
    try {
      const res = await resetPasswordLinkFn({ email });
      const link = (res.data as any)?.link as string;
      setResetLink(link);
    } catch (e: any) {
      setResetErr(e?.message ?? "שגיאה ביצירת לינק");
    } finally {
      setResetLoading(false);
    }
  }

  // Set Role
  const [uid, setUid] = useState("");
  const [role, setRole] = useState<"admin" | "restaurant" | "courier">("courier");
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleMsg, setRoleMsg] = useState<string | null>(null);

  async function onSetRole(e: React.FormEvent) {
    e.preventDefault();
    setRoleMsg(null);
    setRoleLoading(true);
    try {
      await setUserRoleFn({ uid, role });
      setRoleMsg("Role נשמר בהצלחה");
    } catch (e: any) {
      setRoleMsg(e?.message ?? "שגיאה בשמירת Role");
    } finally {
      setRoleLoading(false);
    }
  }

  return (
    <>
      <AdminNav />

      <main className="container mx-auto p-6" dir="rtl">
        <h1 className="text-2xl font-bold mb-6">כלי אדמין</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* טופס יצירת לינק לאיפוס סיסמה */}
          <section className="rounded-2xl border border-white/15 p-6">
            <h2 className="text-lg font-semibold mb-3">איפוס סיסמה (לינק)</h2>
            <form onSubmit={onMakeResetLink} className="grid gap-3 max-w-md">
              <input
                type="email"
                className="border rounded px-3 py-2 bg-transparent"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                disabled={resetLoading}
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              >
                {resetLoading ? "יוצר..." : "צור לינק איפוס"}
              </button>
              {resetErr && <div className="text-red-400">{resetErr}</div>}
              {resetLink && (
                <div className="text-sm">
                  לינק מוכן:{" "}
                  <a className="underline" href={resetLink} target="_blank" rel="noreferrer">
                    {resetLink}
                  </a>
                </div>
              )}
            </form>
          </section>

          {/* טופס הקצאת תפקיד למשתמש */}
          <section className="rounded-2xl border border-white/15 p-6">
            <h2 className="text-lg font-semibold mb-3">הקצאת Role למשתמש</h2>
            <form onSubmit={onSetRole} className="grid gap-3 max-w-md">
              <input
                className="border rounded px-3 py-2 bg-transparent"
                placeholder="User UID"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                required
              />
              <select
                className="border rounded px-3 py-2 bg-transparent"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="courier">courier</option>
                <option value="restaurant">restaurant</option>
                <option value="admin">admin</option>
              </select>
              <button
                disabled={roleLoading}
                className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
              >
                {roleLoading ? "שומר..." : "שמור Role"}
              </button>
              {roleMsg && <div className="text-sm">{roleMsg}</div>}
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
