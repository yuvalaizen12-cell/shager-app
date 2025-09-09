// src/app/layout.tsx
export const dynamic = "force-dynamic";
import "./globals.css";

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-neutral-950 text-neutral-50">
        {children}
      </body>
    </html>
  );
}
