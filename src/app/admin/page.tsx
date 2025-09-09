"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { seedDemoData } from "@/lib/store";

const cards = [
  { href: "/admin/couriers",    title: "יצירת שליחים",   desc: "הוספה ועריכה של שליחים" },
  { href: "/admin/restaurants",  title: "יצירת בית עסק",  desc: "ניהול מסעדות" }, 
  { href: "/admin/active",       title: "שליחים פעילים",  desc: "זמינות ומצב בזמן אמת" },
  { href: "/admin/assigned",     title: "משלוחים משובצים", desc: "ניהול והחלפה/ביטול שיבוצים קיימים" },
  { href: "/admin/orders",       title: "משלוחים לא משובצים", desc: "שיבוץ לפי זמן יעד" },
  { href: "/admin/summary",      title: "סיכום יומי",      desc: "התפלגות פר מסעדה" },
];

export default function AdminHome() {
  useEffect(() => {
    seedDemoData().catch(() => {});
  }, []);

  return (
    <>
      <AdminNav />

      {/* Hero */}
      <header className="container mx-auto px-6 pt-6">
        <div className="rounded-2xl p-6 text-white bg-gradient-to-r from-indigo-600 to-blue-500 shadow">
          <div className="text-sm/5 opacity-90">מנהל</div>
          <h1 className="text-2xl md:text-3xl font-bold">דשבורד</h1>
          <p className="text-white/90 mt-1 text-sm">
            ניהול שליחים, מסעדות ומשלוחים בזמן אמת
          </p>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-2xl border border-white/15 p-6 hover:bg-white/5 transition text-right"
            >
              <div className="text-lg font-semibold mb-2">{c.title}</div>
              <div className="text-sm text-gray-400">{c.desc}</div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

