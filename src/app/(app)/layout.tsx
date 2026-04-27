"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("billing_user");
    if (!user) {
      router.push("/login");
    } else {
      setAuthenticated(true);
    }
    // Restore sidebar state
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") setSidebarCollapsed(true);
    setChecking(false);
  }, [router]);

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  };

  if (checking || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 print:block print:bg-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <main className={`flex-1 p-6 transition-all duration-200 print:ml-0 print:p-0 ${sidebarCollapsed ? "ml-[60px]" : "ml-[240px]"}`}>
        {children}
      </main>
    </div>
  );
}
