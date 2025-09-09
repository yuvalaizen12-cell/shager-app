"use client";
export const dynamic = "force-dynamic";
import { useEffect, useMemo, useState } from "react";
import AdminNav from "@/components/AdminNav";
import Toast from "@/components/Toast";
import { InMemoryStore } from "@/lib/store";
import type { Restaurant } from "@/lib/models";

// PIN מנהל – ניתן להגדיר ב-.env.local (ולבצע restart לשרת)
// NEXT_PUBLIC_ADMIN_PIN=2468
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "2468";

type NewRestaurant = {
  name: string;
  address: string;
  ownerName: string;
  phone: string;
  email: string;     // שם משתמש (חובה)
  password: string;  // סיסמה ראשונית (חובה)
};

export default function RestaurantsAdmin() {
  const [list, setList] = useState<Restaurant[]>([]);
  const [form, setForm] = useState<NewRestaurant>({
    name: "",
    address: "",
    ownerName: "",
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
  const [resetTarget, setResetTarget] = useState<Restaurant | null>(null);
  const [managerPin, setManagerPin] = useState("");
  const [newPass, setNewPass] = useState("");
  const [busyReset, setBusyReset] = useState(false);

  // מודל מחיקה
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null);
  const [deletePin, setDeletePin] = useState("");
  const [busyDelete, setBusyDelete] = useState(false);

  const load = async () => setList(await InMemoryStore.listRestaurants());
  useEffect(() => {
    load();
  }, []);

  // כלל סיסמה: לפחות 6 תווים ולפחות אות באנגלית
  const passwordOk = useMemo(
    () => /[A-Za-z]/.test(form.password) && form.password.length >= 6,
    [form.password]
  );

  const formValid = useMemo(
    () =>
      Boolean(
        form.name.trim() &&
          form.address.trim() &&
          form.ownerName.trim() &&
          form.phone.trim() &&
          form.email.trim() && // חובה – שם המשתמש להתחברות
          passwordOk // חובה – כלל הסיסמה
      ),
    [form, passwordOk]
  );

  const create = async () => {
    try {
      if (!formValid) {
        if (!passwordOk) {
          setErrorMsg("הסיסמה חייבת לכלול לפחות 6 תווים ולפחות אות באנגלית.");
        } else {
          setErrorMsg("אנא מלא/י את כל שדות היצירה.");
        }
        return;
      }
      const created = await InMemoryStore.createRestaurant({
        name: form.name.trim(),
        address: form.address.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        isActive: true,
      });
      await InMemoryStore.setRestaurantPassword(
        form.email.trim(),
        form.password
      );
      setSuccessMsg(`המסעדה "${created.name}" נוצרה בהצלחה.`);
      setForm({
        name: "",
        address: "",
        ownerName: "",
        phone: "",
        email: "",
        password: "",
      });
      await load();
    } catch (e: any) {
      setErrorMsg(e?.message || "שגיאה ביצירת מסעדה");
    }
  };

  const openReset = (r: Restaurant) => {
    setResetTarget(r);
    setManagerPin("");
    setNewPass("");
  };

  const doReset = async () => {
    if (!resetTarget) return;
    try {
      if (managerPin !== ADMIN_PIN) {
        setErrorMsg("סיסמת מנהל שגויה.");
        return;
      }
      if (!/[A-Za-z]/.test(newPass) || newPass.length < 6) {
        setErrorMsg("הזן/י סיסמה חדשה – לפחות 6 תווים ולפחות אות באנגלית.");
        return;
      }
      if (!resetTarget.email) {
        setErrorMsg("למסעדה אין אימייל מוגדר.");
        return;
      }
      setBusyReset(true);
      await InMemoryStore.resetRestaurantPassword(resetTarget.email, newPass);
      setSuccessMsg("סיסמת המסעדה אופסה בהצלחה.");
      setResetTarget(null);
    } catch (e: any) {
      setErrorMsg(e?.message || "שגיאה באיפוס סיסמה");
    } finally {
      setBusyReset(false);
    }
  };

  const openDelete = (r: Restaurant) => {
    setDeleteTarget(r);
    setDeletePin("");
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deletePin !== ADMIN_PIN) {
        setErrorMsg("סיסמת מנהל שגויה.");
        return;
      }
      setBusyDelete(true);

      const hasHardDelete = typeof (InMemoryStore as any).deleteRestaurant === "function";
      if (hasHardDelete) {
        await (InMemoryStore as any).deleteRestaurant(deleteTarget.id);
      } else {
        // Fallback – נטרול כניסה: מאפסים אימייל ומסמנים כלא פעיל
        await InMemoryStore.updateRestaurant(deleteTarget.id, {
          email: "",
          isActive: false,
        });
      }

      setSuccessMsg(`"${deleteTarget.name}" נמחקה.`);
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      setErrorMsg(e?.message || "שגיאה במחיקת מסעדה");
    } finally {
      setBusyDelete(false);
    }
  };

  return (
    <>
      <AdminNav />

      {/* Toasts */}
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

      {/* כותרת חדה כמו בדשבורד */}
      <header className="container mx-auto px-6 pt-6">
        <div className="rounded-2xl p-6 text-white bg-gradient-to-r from-indigo-600 to-blue-500 shadow">
          <h1 className="text-2xl md:text-3xl font-bold">ניהול מסעדות</h1>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {/* אזור יצירה */}
        <div className="text-lg font-semibold mb-3">יצירת בית עסק</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* שם המסעדה */}
          <label className="text-sm text-white/80">
            שם המסעדה
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-white text-black px-3 py-2"
              placeholder="לדוגמה: פיצה טוני"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>

          {/* כתובת */}
          <label className="text-sm text-white/80">
            כתובת המסעדה
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-white text-black px-3 py-2"
              placeholder="רחוב ומספר, עיר"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
            />
          </label>

          {/* שם בעל העסק */}
          <label className="text-sm text-white/80">
            שם בעל העסק
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-white text-black px-3 py-2"
              placeholder="שם בעל העסק"
              value={form.ownerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, ownerName: e.target.value }))
              }
            />
          </label>

          {/* טלפון */}
          <label className="text-sm text-white/80">
            טלפון
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-white text-black px-3 py-2 ltr"
              placeholder="050-0000000"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </label>

          {/* אימייל */}
          <label className="text-sm text-white/80">
            אימייל (שם משתמש)
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-white text-black px-3 py-2 ltr"
              placeholder="owner@restaurant.com"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </label>

          {/* סיסמה */}
          <label className="text-sm text-white/80">
            סיסמה  (חובה)
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-white/15 bg-white text-black px-3 py-2"
              placeholder="6 תווים ואות באנגלית"
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
        </div>

        {/* כפתור יצירה – במרכז */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={create}
            disabled={!formValid}
            className={[
              "rounded-2xl px-5 py-2 font-medium",
              formValid
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed",
            ].join(" ")}
          >
            הוסף מסעדה
          </button>
        </div>

        {/* טבלה – כמו בשליחים */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur">
            <thead className="bg-white/5">
              <tr className="[&>th]:py-3 [&>th]:px-4 text-right text-sm text-white/80">
                <th>שם המסעדה</th>
                <th>כתובת המסעדה</th>
                <th>שם בעל העסק</th>
                <th>טלפון</th>
                <th>אימייל</th>
                <th>איפוס סיסמה</th>
                <th>מחיקה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {list.map((r) => (
                <tr key={r.id} className="hover:bg-white/5">
                  <td className="py-3 px-4">{r.name}</td>
                  <td className="py-3 px-4">{r.address}</td>
                  <td className="py-3 px-4">{r.ownerName}</td>
                  <td className="py-3 px-4 ltr whitespace-nowrap">{r.phone}</td>
                  <td className="py-3 px-4 ltr whitespace-nowrap">
                    {r.email || "-"}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openReset(r)}
                      className="rounded-lg bg-amber-600 px-3 py-1 text-white hover:bg-amber-700 disabled:opacity-50"
                      disabled={!r.email}
                      title={r.email ? "" : "אין אימייל למשתמש הזה"}
                    >
                      איפוס סיסמה
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openDelete(r)}
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
                    colSpan={7}
                    className="py-10 text-center text-gray-400 text-sm"
                  >
                    אין מסעדות עדיין.
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
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value)}
                  placeholder="••••••"
                />
              </label>

              <label className="block text-sm text-white/80">
                סיסמה חדשה למסעדה ({resetTarget.name})
                <input
                  type="password"
                  className="mt-1 w-full rounded-md bg-black/30 border border-white/10 px-3 py-2"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="6 תווים ואות באנגלית"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-start gap-2">
              <button
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                onClick={doReset}
                disabled={busyReset}
              >
                {busyReset ? "מעדכן…" : "אפס סיסמה"}
              </button>
              <button
                className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                onClick={() => setResetTarget(null)}
                disabled={busyReset}
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
              פרטי ההתחברות שלה.
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
              <button
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                onClick={doDelete}
                disabled={busyDelete}
              >
                {busyDelete ? "מוחק…" : "מחק"}
              </button>
              <button
                className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                onClick={() => setDeleteTarget(null)}
                disabled={busyDelete}
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
