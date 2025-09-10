'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

type Props = {
  role: 'admin' | 'courier' | 'driver' | string;
  children: React.ReactNode;
  fallbackPath?: string;
};

export default function RequireRole({ role, children, fallbackPath = '/admin/login' }: Props) {
  const { user, role: myRole, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // לא מחוברת? – שלחי ללוגאין
    if (!user) {
      if (pathname !== fallbackPath) router.replace(fallbackPath);
      return;
    }

    // מחוברת אבל ללא תפקיד מתאים? – שלחי ללוגאין המתאים
    if (myRole !== role) {
      router.replace(fallbackPath);
    }
  }, [user, myRole, loading, router, pathname, fallbackPath, role]);

  if (loading) return <div className="p-6 text-center">טוען…</div>;
  if (!user || myRole !== role) return null; // בזמן הניווט

  return <>{children}</>;
}
