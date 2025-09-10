'use client';
export const dynamic = 'force-dynamic';
import { useAuth } from '@/components/AuthProvider';
import { redirect } from "next/navigation";


export default function AdminHomePage() {
   redirect("/admin/active");
  const { user } = useAuth();
  return (
    <main dir="rtl" className="p-6">
      <h1 className="text-2xl font-bold mb-2">דשבורד</h1>
      <div>שלום {user?.email}</div>
    </main>
  );
}
