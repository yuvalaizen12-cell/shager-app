export const dynamic = "force-dynamic";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}

