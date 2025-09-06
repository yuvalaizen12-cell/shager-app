// web/src/components/admin/AdminPasswordResetButton.tsx
"use client";
import { useState } from "react";
import { callAdminGeneratePasswordResetLink } from "../../lib/firebase/functions";
import { reauthWithPassword } from "../../lib/firebase/reauth";

export default function AdminPasswordResetButton({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setError(null);
    setBusy(true);
    try {
      await reauthWithPassword(password); // אימות מנהל
      const { link } = await callAdminGeneratePasswordResetLink(email);
      setLink(link);
    } catch (e: any) {
      setError(e?.message ?? "שגיאה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="btn btn-sm" onClick={() => setShow(true)}>
        איפוס סיסמה
      </button>

      {show && (
        <div className="fixed inset-0 grid place-items-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-zinc-900 p-5 shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">אימות מנהל</h3>
            <label className="block text-sm mb-1">סיסמת מנהל</label>
            <input
              type="password"
              className="w-full rounded-md bg-zinc-800 p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <div className="mt-4 flex gap-2">
              <button disabled={busy} className="btn" onClick={handleReset}>
                קבל לינק איפוס
              </button>
              <button className="btn btn-ghost" onClick={() => setShow(false)}>
                סגור
              </button>
            </div>

            {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
            {link && (
              <div className="mt-3 text-sm">
                <div className="mb-2 break-all rounded bg-zinc-800 p-2">{link}</div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => navigator.clipboard.writeText(link)}
                >
                  העתק לקליפבורד
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}


