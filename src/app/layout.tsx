import "./globals.css";
import type { Metadata } from "next";
// app/layout.tsx
import { AuthProvider } from '@/components/AuthProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: "Shager App",
  description: "ניהול משלוחים",
};

