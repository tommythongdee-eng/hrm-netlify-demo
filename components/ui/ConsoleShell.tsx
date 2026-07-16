"use client";

import { LucideIcon, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

export interface ConsoleNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface ConsoleShellProps {
  navItems: ConsoleNavItem[];
  brandLabel: string;
  subLabel?: string;
  onLogout: () => void;
  children: ReactNode;
}

export function ConsoleShell({ navItems, brandLabel, subLabel, onLogout, children }: ConsoleShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Longest-href-first so a nested route (e.g. /dashboard/employees/:id) matches
  // its section ("Employees") rather than falling through to a shorter prefix.
  const activeItem = [...navItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`));
  const pageTitle = activeItem?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen">
      {mobileOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/50 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between bg-slate-900 p-4 transition-transform md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="mb-6 flex items-center justify-between px-2">
            <div>
              <p className="text-sm font-semibold text-white">{brandLabel}</p>
              {subLabel && <p className="text-xs text-slate-400">{subLabel}</p>}
            </div>
            <button
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="text-slate-400 hover:text-white md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = item === activeItem;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </aside>

      <div className="flex-1 md:ml-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-8">
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="text-slate-500 hover:text-slate-900 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold text-slate-900">{pageTitle}</h1>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
