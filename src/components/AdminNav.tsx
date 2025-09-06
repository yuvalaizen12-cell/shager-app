"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "מנהל — דשבורד" },
  { href: "/admin/couriers", label: "שליחים" },
  { href: "/admin/restaurants", label: "מסעדות" },
  { href: "/admin/active", label: "שליחים פעילים" },
  { href: "/admin/assigned", label: "משלוחים משובצים" }, // ← חדש
  { href: "/admin/orders", label: "משלוחים לא משובצים" },
  { href: "/admin/summary", label: "סיכום יומי" },
];

export default function AdminNav() {
  const path = usePathname();
  const activeItem = items.find((i) => i.href === path);

  return (
    <div className="sticky top-0 z-50">
      {/* פס עליון כהה עם טשטוש עדין */}
      <div className="bg-neutral-900/70 backdrop-blur border-b border-white/10">
        <nav className="container mx-auto px-4 py-3">
          <ul className="flex gap-2 items-center overflow-x-auto">
            {items.map((it) => {
              const active = path === it.href;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    className={[
                      "inline-flex items-center rounded-full px-4 py-1.5 text-sm transition",
                      active
                        ? "bg-white text-black shadow"
                        : "text-white/80 hover:text-white hover:bg-white/10",
                    ].join(" ")}
                  >
                    {it.label}
                  </Link>
                </li>
              );
            })}

            {/* צ'יפ מידע קטן בצד ימין - מציג את העמוד הפעיל */}
            <li className="ml-auto hidden md:block">
              <span className="inline-flex items-center rounded-full bg-white/10 text-white/80 px-3 py-1 text-xs">
                {activeItem?.label ?? "מנהל — דשבורד"}
              </span>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
