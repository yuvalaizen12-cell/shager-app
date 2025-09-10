'use client';

import { signOut } from 'firebase/auth';
import { getClientAuth } from '@/lib/auth';

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut(getClientAuth())}
      className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
    >
      התנתקות
    </button>
  );
}
