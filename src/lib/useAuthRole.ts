// web/src/lib/useAuthRole.ts
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export function useAuthRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }
      const tokenResult = await user.getIdTokenResult(true);
      setRole((tokenResult.claims as any)?.role ?? null);
      setLoading(false);
    });
  }, []);

  return { role, loading };
}
