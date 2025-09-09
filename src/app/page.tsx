// src/app/page.tsx
"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";

export default function Home() {
  return (
    <main dir="rtl" className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">ברוכים הבאים</h1>
      <ul className="list-disc pr-5 space-y-2">
        <li><Link href="/admin">כניסת מנהל</Link></li>
        <li><Link href="/courier/login">כניסת שליח</Link></li>
      </ul>
    </main>
  );
}
