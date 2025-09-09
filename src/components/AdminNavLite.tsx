"use client";
import Link from "next/link";

export default function AdminNavLite() {
  return (
    <nav dir="rtl" className="px-6 py-3 border-b border-white/10 flex gap-4">
      <Link href="/">בית</Link>
      <Link href="/admin">דשבורד</Link>
      <Link href="/admin/orders">משלוחים</Link>
      <Link href="/admin/couriers">שליחים</Link>
    </nav>
  );
}
