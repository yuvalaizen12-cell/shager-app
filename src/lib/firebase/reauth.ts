// web/src/lib/firebase/reauth.ts
import { getAuth, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export async function reauthWithPassword(password: string) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("אין משתמש מחובר");

  const cred = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, cred);
}
