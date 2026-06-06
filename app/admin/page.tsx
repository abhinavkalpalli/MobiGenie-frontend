"use client";

import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminDashboard() {
  const { user } = useAdminAuth();

  const cards = [
    {
      title: "Manage Phones",
      description: "Add, edit, and delete phone listings",
      href: "/admin/phones",
      icon: "📱",
    },
    {
      title: "Manage Users",
      description: "View users and update roles",
      href: "/admin/users",
      icon: "👥",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-gray-400 text-sm mb-8">Welcome back, {user?.name}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-500 transition-colors group"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <h2 className="text-white font-semibold group-hover:text-indigo-400 transition-colors">
              {card.title}
            </h2>
            <p className="text-gray-500 text-sm mt-1">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
