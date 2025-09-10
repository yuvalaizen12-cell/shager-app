"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientAuth } from "@/lib/auth";
import { getClientDb } from "@/lib/db";
import RequireRole from '@/components/RequireRole';

export default function CourierLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole need="courier">{children}</RequireRole>;
}

