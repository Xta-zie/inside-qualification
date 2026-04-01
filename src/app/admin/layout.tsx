import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const { name, email, image } = session.user;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar
        userName={name ?? "Administrateur"}
        userEmail={email ?? ""}
        userImage={image ?? undefined}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
