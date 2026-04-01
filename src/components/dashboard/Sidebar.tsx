"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  PlusCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserInfo {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "admin" | "manager" | "user";
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  separator?: boolean;
}

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: "/dashboard/analytics",
    label: "Analytiques",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    href: "/admin",
    label: "Administration",
    icon: <Settings className="h-5 w-5" />,
    adminOnly: true,
    separator: true,
  },
  {
    href: "/assessment",
    label: "Nouvelle évaluation",
    icon: <PlusCircle className="h-5 w-5" />,
  },
];

// ---------------------------------------------------------------------------
// Role badge color mapping
// ---------------------------------------------------------------------------

const ROLE_BADGE_CLASSES: Record<UserInfo["role"], string> = {
  admin: "bg-inside-pink/10 text-inside-pink border-inside-pink/20",
  manager: "bg-purple-100 text-purple-700 border-purple-200",
  user: "bg-inside-blue/10 text-inside-blue border-inside-blue/20",
};

// ---------------------------------------------------------------------------
// Sidebar link
// ---------------------------------------------------------------------------

function SidebarLink({ item }: { item: NavItem }) {
  const pathname = usePathname();

  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        isActive
          ? "bg-inside-blue/10 font-bold text-inside-blue"
          : "text-gray-600 hover:bg-gray-50 hover:text-inside-blue"
      }`}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------

export function Sidebar({ user }: { user: UserInfo }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user.role === "admin";

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div className="flex h-16 items-center px-6">
        <img src="/images/logos/academy-horizontal.png" alt="INSIDE Academy" className="h-9" />
      </div>
      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleItems.map((item, index) => (
          <div key={item.href}>
            {item.separator && (
              <Separator className="my-3" />
            )}
            <SidebarLink item={item} />
          </div>
        ))}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name ?? "Avatar"} />
            ) : null}
            <AvatarFallback className="bg-inside-blue text-sm font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-gray-900">
              {user.name ?? "Utilisateur"}
            </p>
            <p className="truncate text-xs text-gray-500">
              {user.email}
            </p>
            <Badge
              variant="outline"
              className={`mt-1 text-[10px] ${ROLE_BADGE_CLASSES[user.role]}`}
            >
              {user.role}
            </Badge>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start text-gray-500 hover:text-inside-pink"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-md border border-gray-200 bg-white p-2 shadow-sm md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {mobileOpen ? (
          <X className="h-5 w-5 text-gray-700" />
        ) : (
          <Menu className="h-5 w-5 text-gray-700" />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - desktop: fixed visible, mobile: slide-in */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
