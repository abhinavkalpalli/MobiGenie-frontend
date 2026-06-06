"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Loader from "@/components/Loader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAdminAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const NavContent = () => (
    <>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 px-2">
        Admin Panel
      </div>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setSidebarOpen(false)}
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
    </>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-gray-900 border-r border-gray-800 flex-col py-6 px-4 gap-1 flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile sidebar */}
      <aside className={`
        fixed md:hidden z-30 top-0 left-0 h-full w-64
        bg-gray-900 border-r border-gray-800 flex flex-col py-6 px-4 gap-1
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <NavContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-white">Admin Panel</span>
        </div>
        <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
