"use client";
export const dynamic = "force-dynamic";

export default function Debug() {
  const mask = (v?: string) => (v ? v.slice(0, 6) + "•••" + v.slice(-4) : "(missing)");
  return (
    <pre style={{ padding: 16 }}>
      {JSON.stringify(
        {
          apiKey: mask(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: mask(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
        },
        null,
        2
      )}
    </pre>
  );
}
