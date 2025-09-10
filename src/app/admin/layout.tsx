// src/app/admin/layout.tsx
export const dynamic = "force-dynamic";

import AdminNav from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main dir="rtl" className="p-4">
      <AdminNav />
      {children}
    </main>
  );
}
