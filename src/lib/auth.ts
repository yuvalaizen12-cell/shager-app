import { onAuthStateChanged, getAuth } from "firebase/auth";

const auth = getAuth();
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const token = await user.getIdToken(true);
  const { claims } = await user.getIdTokenResult();
  // claims.role === "admin" | "restaurant" | "courier"
  // לשמור ב-state ולהגן על ראוטים לפי role
});
