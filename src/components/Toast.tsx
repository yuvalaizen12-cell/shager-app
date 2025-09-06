"use client";

import { ReactNode } from "react";

type Kind = "success" | "error" | "info";

export default function Toast({
  kind = "info",
  children,
  onClose,
}: {
  kind?: Kind;
  children: ReactNode;
  onClose?: () => void;
}) {
  const styles: Record<Kind, string> = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <div
      className={[
        "min-w-[260px] max-w-sm rounded-md border px-3 py-2 shadow-lg",
        "transition-opacity duration-300",
        styles[kind],
      ].join(" ")}
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
    >
      <div className="flex items-start gap-3">
        <div className="text-base leading-5">{children}</div>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto -mt-1 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-black/5"
          aria-label="סגור"
          title="סגור"
        >
          ×
        </button>
      </div>
    </div>
  );
}
