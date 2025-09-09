"use client";
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  return <section dir="rtl">{children}</section>;
}
