"use client";
import { usePathname } from "next/navigation";
import { SiteHeader } from "./nav";
import type { User as U } from "@/db/schema";

export function HeaderSwitcher({ user }: { user: U | null }) {
  const path = usePathname();
  if (path?.startsWith("/overlay")) return null;
  return <SiteHeader user={user} />;
}
