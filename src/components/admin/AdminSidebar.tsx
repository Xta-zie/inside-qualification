"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HelpCircle,
  Target,
  BookOpen,
  Users,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
  userImage?: string;
}

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { href: "/admin/questions", label: "Questions", icon: HelpCircle },
  { href: "/admin/baselines", label: "Baselines / R\u00f4les", icon: Target },
  { href: "/admin/training", label: "Modules Formation", icon: BookOpen },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminSidebar({
  userName,
  userEmail,
  userImage,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

  return (
    <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white md:flex">
      {/* Logo area */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6">
        <span
          className="text-2xl tracking-wider text-inside-blue"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          INSIDE
        </span>
        <Badge className="bg-inside-pink text-white hover:bg-inside-pink/90 text-[10px]">
          Admin
        </Badge>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-inside-pink/10 font-bold text-inside-pink"
                  : "text-gray-600 hover:bg-gray-50 hover:text-inside-pink"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        <Separator className="my-3" />

        {/* Back to dashboard */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-inside-pink"
        >
          <ArrowLeft className="h-5 w-5" />
          Tableau de bord
        </Link>
      </nav>

      {/* User info */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {userImage ? (
            <Image
              src={userImage}
              alt={userName}
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-inside-pink text-sm font-bold text-white">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {userName ?? "Administrateur"}
            </p>
            <p className="truncate text-xs text-gray-500">{userEmail}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start text-gray-500 hover:text-inside-pink"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          Se d&eacute;connecter
        </Button>
      </div>
    </aside>
  );
}
