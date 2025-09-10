'use client';

import RequireRole from '@/components/RequireRole';
import type { ReactNode } from 'react';

export default function CourierProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RequireRole role="courier" fallbackPath="/courier/login">
      {children}
    </RequireRole>
  );
}
