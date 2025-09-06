"use client";

import { useEffect, useMemo, useState } from "react";
import AdminNav from "@/components/AdminNav";
import Toast from "@/components/Toast";
import { InMemoryStore } from "@/lib/store";
import type { Courier } from "@/lib/models";

// PIN מנהל – ניתן להגדיר ב-.env.local
// NEXT_PUBLIC_ADMIN_PIN=2468
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "2468";

/** מיפוי כלי רכב -> תרגום לעברית */
const VEHICLE_LABEL: Record<string, string> = {
  bike: "אופניים",
  scooter: "קורקינט",
  car: "רכב",
  walking: "הולך רגל",
};

const VEHICLE_OPTIONS = [
  { value: "", label: "בחר כלי תחבורה" },
  { value: "bike", label: VEHICLE_LABEL.bike },
  { value: "scooter", label: VEHICLE_LABEL.scooter },
  { value: "car", label: VEHICLE_LABEL.car },
  { value: "walking", label: VEHICLE_LABEL.walking },
];

type NewCourier = {
  vehicle: string;
  name: string;
  phone: string;
  email: string; // שם משתמש – חובה
  password: string; // סיסמה ראשונית – חובה
};

export default function CouriersAdminPage() {
  // רשימת שליחים
  const [list, setList] = useState<Courier[]>([]);

  // טופס יצירה
  const [form, setForm] = useState<NewCourier>({
    vehicle: "",
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  // Toasts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 3500);
    return () => clearTimeout(t);
  }, [errorMsg]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 2200);
    return () => clearTimeout(t);
  }, [successMsg]);

  // מודל איפוס סיסמה
  const [resetTarget, setResetTarget] = useState<Courier | null>(null);
  const [resetPin, setResetPin] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  // מודל מחיקה
  const [deleteTarget, setDeleteTarget] = useState<Courier | null>(null);
  const [deletePin, setDeletePin] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = async () => setList(await InMemoryStore.listCouriers());
  useEffect(() => {
    load();
  }, []);

  // כלל סיסמה: לפחות 6 תווים ולפחות אות באנגלית
  const passwordOk = useMemo(
    () => /[A-Za-z]/.test(form.password) && form.password.length >= 6,
    [form.password]
  );

  // תקינות כללית של הטופס
  const valid = useMemo(
    () =>
      Boolean(
        form.vehicle &&
          form.name.trim() &&
          form.phone.trim() &&
          form.email.trim() && // חובה – התחברות מצד השליח
          passwordOk // חובה – כלל הסיסמה
      ),
    [form, passwordOk]
  );

  const create = async () => {
    try {
      if (!valid) {
        if (!passwordOk) {
          setErrorMsg("הסיסמה חייבת לכלול לפחות 6 תווים ולפחות אות באנגלית.");
        } else {
          setErrorMsg("אנא מלא/י את כל השדות החיוניים.");
        }
        return;
      }

      const created = await InMemoryStore.createCourier({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        status: "available",
      });

      await InMemoryStore.setCourierPassword(form.email.trim(), form.password);

      setSuccessMsg(`השליח "${created.name}" נוצר בהצלחה.`);
      setForm({ vehicle: "", name: "", phone: "", email: "", password: "" });
      await load();
    } catch (e: any) {
      setErrorMsg(e?.message || "שגיאה ביצירת שליח");
    }
  };

  // פתיחת מודל איפוס
  const openReset = (c: Courier) => {
    setResetTarget(c);
    setResetPin("");
    setResetNewPass("");
  };

  // איפוס סיסמה בפועל (דורש PIN מנהל)
  const doReset = async () => {
    if (!resetTarget) return;
    try {
      if (resetPin !== ADMIN_PIN) {
        setErrorMsg("סיסמת מנהל שגויה.");
        return;
      }
      // נדרוש גם כאן לפחות 6 תווים ולפחות אות
      if (!/[A-Za-z]/.test(resetNewPass) || resetNewPass.length < 6) {
        setErrorMsg("הזן/י סיסמה חדשה – 6 תווים ואות באנגלית.");
        return;
      }
      if (!resetTarget.email) {
        setErrorMsg("לשליח אין אימייל מוגדר.");
        return;
      }

      setResetBusy(true);
      await InMemoryStore.resetCourierPassword(resetTarget.email, resetNewPass);
      setSuccessMsg("הסיסמה אופסה בהצלחה.");
      setResetTarget(null);
    } catch (e: any) {
      setErrorMsg(e?.message || "שגיאה באיפוס סיסמה");
    } finally {
      setResetBusy(false);
    }
  };

  // פתיחת מודל מחיקה
  const openDelete = (c: Courier) => {
    setDeleteTarget(c);
    setDeletePin("");
  };

  // מחיקה בפועל (דורש PIN מנהל)
  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deletePin !== ADMIN_PIN) {
        setErrorMsg("סיסמת מנהל שגויה.");
        return;
      }
      setDeleteBusy(true);
      await InMemoryStore.deleteCourier(deleteTarget.id);
      setSuccessMsg(`"${deleteTarget.name}" נמחק.`);
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      setErrorMsg(e?.message || "שגיאה במחיקה");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <AdminNav />

      {/* טוסטים */}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {errorMsg && (
          <Toast kind="error" onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Toast>
        )}
        {successMsg && (
          <Toast kind="success" onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </Toast>
        )}
      </div>

      {/* כותרת Hero */}
      <header className="container mx-auto px-6 pt-6">
        <div className="rounded-2xl p-6 text-white bg-gradient-to-r from-indigo-600 to-blue-500 shadow">
          <h1 className="text-2xl md:text-3xl font-bold">ניהול שליחים</h1>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {/* טופס יצירת שליח – שורה אחת + כפתור ירוק באותה שורה */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          {/* כלי תחבורה */}
          <label className="text-sm text-white/80">
            כלי תחבורה
            <select
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2"
              value={form.vehicle}
              onChange={(e) =>
                setForm((f) => ({ ...f, vehicle: e.target.value }))
              }
            >
              {VEHICLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {/* שם מלא */}
          <label className="text-sm text-white/80">
            שם מלא
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2"
              placeholder="שם מלא"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </label>

          {/* טלפון */}
          <label className="text-sm text-white/80">
            מספר טלפון
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 ltr"
              placeholder="050-0000000"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </label>

          {/* אימייל (שם משתמש) */}
          <label className="text-sm text-white/80">
            אימייל (חובה — שם משתמש)
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 ltr"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </label>

          {/* סיסמה ראשונית */}
          <label className="text-sm text-white/80">
            סיסמה (חובה)
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2"
              placeholder=" 6 תווים ואות באנגלית"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
            />
            {form.password && !passwordOk && (
              <div className="mt-1 text-xs text-red-400">
                הסיסמה חייבת לכלול לפחות 6 תווים ולפחות אות באנגלית
              </div>
            )}
          </label>

          {/* כפתור הוספה */}
          <div className="md:justify-self-start">
            <button
              onClick={create}
              disabled={!valid}
              className={[
                "w-full md:w-auto rounded-2xl px-5 py-2 font-medium",
                valid
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed",
              ].join(" ")}
            >
              הוסף שליח
            </button>
          </div>
        </div>

        {/* טבלה – בלי סטטוס, עם הפרדה ברורה */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur">
            <thead className="bg-white/5">
              <tr className="[&>th]:py-3 [&>th]:px-4 text-right text-sm text-white/80">
                <th>שם</th>
                <th>טלפון</th>
                <th>כלי רכב</th>
                <th>אימייל</th>
                <th>איפוס סיסמה</th>
                <th>מחיקה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-white/5">
                  <td className="py-3 px-4 whitespace-nowrap">{c.name}</td>
                  <td className="py-3 px-4 whitespace-nowrap ltr">{c.phone}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {VEHICLE_LABEL[c.vehicle || ""] || "-"}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap ltr">
                    {c.email || "-"}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openReset(c)}
                      className="rounded-lg bg-amber-600 px-3 py-1 text-white hover:bg-amber-700 disabled:opacity-50"
                      disabled={!c.email}
                      title={c.email ? "" : "אין אימייל לשיוך"}
                    >
                      איפוס סיסמה
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openDelete(c)}
                      className="rounded-lg bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                    >
                      מחק
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-gray-400 text-sm"
                  >
                    אין שליחים עדיין.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* מודל איפוס סיסמה */}
      {resetTarget && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-white/10 p-6 text-right">
            <h3 className="text-xl font-bold mb-4">אימות מנהל</h3>

            <div className="space-y-4">
              <label className="block text-sm text-white/80">
                סיסמת מנהל
                <input
                  type="password"
                  className="mt-1 w-full rounded-md bg-black/30 border border-white/10 px-3 py-2"
                  value={resetPin}
                  onChange={(e) => setResetPin(e.target.value)}
                  placeholder="••••••"
                />
              </label>

              <label className="block text-sm text-white/80">
                סיסמה חדשה לשליח ({resetTarget.name})
                <input
                  type="password"
                  className="mt-1 w-full rounded-md bg-black/30 border border-white/10 px-3 py-2"
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  placeholder="לפחות 6 תווים ולפחות אות באנגלית"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-start gap-2">
              {/* קודם "אפס סיסמה" ואז "סגור" – נעים לעין */}
              <button
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                onClick={doReset}
                disabled={resetBusy}
              >
                {resetBusy ? "מעדכן…" : "אפס סיסמה"}
              </button>
              <button
                className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                onClick={() => setResetTarget(null)}
                disabled={resetBusy}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* מודל מחיקה */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-white/10 p-6 text-right">
            <h3 className="text-xl font-bold mb-3">אימות מנהל</h3>
            <p className="text-white/80 text-sm mb-4">
              אתה עומד למחוק את <b>{deleteTarget.name}</b>. פעולה זו תמחק גם את
              פרטי ההתחברות שלו.
            </p>

            <label className="block text-sm text-white/80">
              סיסמת מנהל
              <input
                type="password"
                className="mt-1 w-full rounded-md bg-black/30 border border-white/10 px-3 py-2"
                value={deletePin}
                onChange={(e) => setDeletePin(e.target.value)}
                placeholder="••••••"
              />
            </label>

            <div className="mt-6 flex items-center justify-start gap-2">
              {/* קודם מחיקה ואז סגירה – ויזואלית נכונה */}
              <button
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                onClick={doDelete}
                disabled={deleteBusy}
              >
                {deleteBusy ? "מוחק…" : "מחק"}
              </button>
              <button
                className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteBusy}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
