"use client";
export default function AdminError({
  error,
  reset,
}: { error: Error; reset: () => void }) {
  return (
    <main dir="rtl" style={{ padding: 16 }}>
      <h1>שגיאת-קליינט באזור admin</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>{error.message}</pre>
      <button onClick={reset}>נסה שוב</button>
    </main>
  );
}
