import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";

// ---------------------------------------------------------------------------
// Dashboard layout (server component)
// ---------------------------------------------------------------------------

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const { name, email, image, role } = session.user;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar (client component for active link detection + mobile menu) */}
      <Sidebar
        user={{
          name,
          email,
          image,
          role,
        }}
      />

      {/* Main content area - offset for fixed sidebar */}
      <div className="flex flex-1 flex-col md:ml-64">
        {/* Top bar with breadcrumb area */}
        <header className="flex h-16 items-center border-b border-gray-200 bg-white px-8">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-inside-blue">
              Tableau de bord
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-gray-900">
              Vue d&apos;ensemble
            </span>
          </nav>
        </header>

        {/* Scrollable main content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
