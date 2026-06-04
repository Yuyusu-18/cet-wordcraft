"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

const navLinks = [
  { href: "/words", label: "📝 单词" },
  { href: "/phrases", label: "📖 短语" },
  { href: "/passages", label: "📚 短文" },
  { href: "/practice", label: "🎯 练习" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-warm-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-warm-600 flex items-center gap-1">
          🌟 WordCraft
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(link.href)
                  ? "bg-warm-100 text-warm-700"
                  : "text-gray-600 hover:bg-warm-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {session ? (
            <>
              <Link
                href="/profile"
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  pathname === "/profile"
                    ? "bg-warm-100 text-warm-700"
                    : "text-gray-600 hover:bg-warm-50"
                }`}
              >
                👤 {session.user?.name || "我的"}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-gray-400 hover:text-gray-600 px-2"
              >
                退出
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="btn-primary text-sm py-1.5 px-4">
              登录
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-warm-100 px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm ${
                pathname.startsWith(link.href)
                  ? "bg-warm-100 text-warm-700"
                  : "text-gray-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {session ? (
            <>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-gray-600"
              >
                👤 个人主页
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block px-3 py-2 text-sm text-gray-400 w-full text-left"
              >
                退出登录
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
              className="block btn-primary text-center"
            >
              登录
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}