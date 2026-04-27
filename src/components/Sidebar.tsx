"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const COMPANY_NAME = "Billing System";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  children?: { href: string; label: string }[];
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/sales",
    label: "Sales",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    children: [
      { href: "/invoices", label: "Invoices" },
      { href: "/customers", label: "Customers" },
      { href: "/payments", label: "Payments" },
    ],
  },
  {
    href: "/purchase",
    label: "Purchase",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
    children: [
      { href: "/purchase/bills", label: "Bills" },
      { href: "/purchase/suppliers", label: "Suppliers" },
    ],
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    children: [
      { href: "/products", label: "Products" },
      { href: "/inventory/categories", label: "Product Category" },
      { href: "/inventory/uom", label: "Unit of Measurement" },
      { href: "/inventory", label: "Stock Overview" },
      { href: "/inventory/movements", label: "Stock Movements" },
      { href: "/inventory/transfer", label: "Warehouse Transfer" },
      { href: "/inventory/production", label: "Production Order" },
      { href: "/inventory/adjustment", label: "Inventory Adjustment" },
    ],
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    children: [
      { href: "/settings/users", label: "Users" },
      { href: "/settings/groups", label: "Group Policy" },
      { href: "/settings/audit-log", label: "Audit Log" },
    ],
  },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>("Billing System");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ "/sales": true, "/purchase": true, "/inventory": true });

  const toggleSection = (href: string) => {
    if (collapsed) return; // Don't toggle sections when collapsed
    setOpenSections((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  useEffect(() => {
    setUser(localStorage.getItem("billing_user"));
    setOrgName(localStorage.getItem("billing_org") || "Billing System");
  }, []);

  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // Close popover on click outside
  useEffect(() => {
    if (!openPopover) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-popover]") && !target.closest("[data-popover-trigger]")) {
        setOpenPopover(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openPopover]);

  // Close popover on route change
  useEffect(() => { setOpenPopover(null); }, [pathname]);

  const handleLogout = () => {
    ["billing_user", "billing_user_id", "billing_username", "billing_org", "billing_is_admin", "billing_permissions", "billing_group"].forEach((k) => localStorage.removeItem(k));
    router.push("/login");
  };

  return (
    <aside className={`fixed left-0 top-0 h-full bg-slate-800 text-white flex flex-col z-50 no-print transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
      {/* Header */}
      <div className="border-b border-slate-700 flex items-center justify-between">
        <Link href="/" className={`flex items-center gap-2 ${collapsed ? "p-4 justify-center w-full" : "p-5 flex-1 min-w-0"}`}>
          <svg className="w-7 h-7 text-teal-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-teal-400 leading-tight truncate">{orgName}</p>
              <p className="text-[10px] text-slate-400">Billing System</p>
            </div>
          )}
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-600 hover:text-white transition-colors z-10"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg className={`w-3.5 h-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = openSections[item.href] && !collapsed;
          const isChildActive = hasChildren && item.children!.some((c) => pathname === c.href || (c.href !== item.href && pathname.startsWith(c.href)));
          const isActive = item.href === "/" ? pathname === "/" : (!hasChildren && pathname.startsWith(item.href));
          const isSectionActive = isActive || isChildActive;

          if (hasChildren) {
            return (
              <div key={item.href} className="relative">
                <button
                  data-popover-trigger
                  onClick={() => {
                    if (collapsed) {
                      setOpenPopover(openPopover === item.href ? null : item.href);
                    } else {
                      toggleSection(item.href);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${collapsed ? "justify-center px-0" : ""} ${
                    isSectionActive ? "text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Click-based popover when collapsed */}
                {collapsed && openPopover === item.href && (
                  <div data-popover className="absolute left-full top-0 ml-2 z-50">
                    <div className="bg-slate-900 text-white text-sm rounded-lg shadow-xl py-2 min-w-48 border border-slate-700">
                      <p className="px-4 py-2 font-semibold text-teal-400 border-b border-slate-700">{item.label}</p>
                      {item.children!.map((child) => {
                        const childActive = pathname === child.href || (child.href !== item.href && pathname.startsWith(child.href));
                        return (
                          <Link key={child.href} href={child.href}
                            onClick={() => setOpenPopover(null)}
                            className={`block px-4 py-2 hover:bg-slate-700 transition-colors ${childActive ? "text-teal-300 bg-slate-800" : "text-slate-300"}`}>
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Expanded children */}
                {isOpen && !collapsed && (
                  <div className="ml-5 border-l border-slate-700">
                    {item.children!.map((child) => {
                      const childActive = pathname === child.href || (child.href !== item.href && pathname.startsWith(child.href));
                      return (
                        <Link key={child.href} href={child.href}
                          className={`block pl-6 pr-5 py-2 text-sm transition-colors ${
                            childActive ? "text-teal-300 bg-slate-700/50" : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                          }`}>
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={item.href} className="relative group">
              <Link href={item.href}
                className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${collapsed ? "justify-center px-0" : ""} ${
                  isActive ? "bg-teal-600 text-white border-r-3 border-teal-300" : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}>
                {item.icon}
                {!collapsed && item.label}
              </Link>
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block z-50">
                  <div className="bg-slate-900 text-white text-xs rounded-lg shadow-xl px-3 py-1.5 whitespace-nowrap">{item.label}</div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-slate-700">
        {user && !collapsed && (
          <div className="px-5 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold shrink-0">
              {user.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user}</p>
              <p className="text-[10px] text-slate-400">Administrator</p>
            </div>
          </div>
        )}
        {user && collapsed && (
          <div className="flex justify-center py-3">
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold">
              {user.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-5 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors ${collapsed ? "justify-center px-0" : ""}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && "Log Out"}
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 border-t border-slate-700 text-xs text-slate-400 text-center">
          This Fiscal Year to Date
        </div>
      )}
    </aside>
  );
}

export { COMPANY_NAME };
