"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Loader from "@/components/Loader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAdminAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader />
      </div>
    );
  }

  if (!isAdmin) return null;

  const navLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/phones", label: "Phones" },
    { href: "/admin/users", label: "Users" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col py-6 px-4 gap-1">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 px-2">
          Admin Panel
        </div>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === link.href
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {link.label}
          </Link>
        ))}
        <div className="mt-auto">
          <Link
            href="/"
            className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-gray-800 transition-colors block"
          >
            ← Back to App
          </Link>
          <div className="px-3 pt-3 text-xs text-gray-600 truncate">{user?.email}</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
