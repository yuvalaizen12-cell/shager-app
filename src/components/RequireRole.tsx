'use client';
import { useAuth } from '@/components/AuthProvider';

export default function RequireRole({
  need, // 'admin' | 'courier' | 'restaurant' | undefined
  children,
}: {
  need?: 'admin' | 'courier' | 'restaurant';
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();

  if (loading) return <main className="p-6">טוען…</main>;

  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = need ? `/${need}/login` : '/courier/login';
    }
    return null;
  }

  if (need && role !== need) {
    if (typeof window !== 'undefined') {
      window.location.href = `/${role ?? 'courier'}/login`;
    }
    return null;
  }

  return <>{children}</>;
}
