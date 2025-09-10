'use client';

import RequireRole from '@/components/RequireRole';
import AdminNav from '@/components/AdminNav'; // אם יש לך קומפוננטה כזו; אם לא – אפשר להשמיט

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="admin" fallbackPath="/admin/login">
      {/* ניווט/כותרת לאדמין */}
      {typeof AdminNav !== 'undefined' ? <AdminNav /> : null}
      <div className="p-4">{children}</div>
    </RequireRole>
  );
}
