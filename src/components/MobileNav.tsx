"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "🏠", name: "首页" },
  { href: "/words", label: "📝", name: "单词" },
  { href: "/practice", label: "🎯", name: "练习" },
  { href: "/profile", label: "👤", name: "我的" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-warm-100 z-50">
      <div className="flex justify-around py-1.5">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center px-3 py-1 rounded-lg text-xs ${
                isActive ? "text-warm-600" : "text-gray-400"
              }`}
            >
              <span className="text-xl">{tab.label}</span>
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}