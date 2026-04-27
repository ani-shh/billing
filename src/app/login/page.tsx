"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [orgName, setOrgName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setError("Please enter your organization name");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) { setError("Please enter username and password"); return; }
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      if (res.ok) {
        const userData = await res.json();
        localStorage.setItem("billing_user", userData.full_name || userData.username);
        localStorage.setItem("billing_user_id", userData.id);
        localStorage.setItem("billing_username", userData.username);
        localStorage.setItem("billing_org", orgName.trim());
        localStorage.setItem("billing_is_admin", String(userData.is_admin));
        localStorage.setItem("billing_permissions", JSON.stringify(userData.permissions));
        localStorage.setItem("billing_group", userData.group_name || "");
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid username or password");
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 mb-4">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Billing System</h1>
          <p className="text-slate-400 text-sm mt-1">
            {step === 1 ? "Enter your organization to get started" : orgName}
          </p>
        </div>

        {/* Step 1: Organization */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your organization name to continue</p>

            <form onSubmit={handleOrgSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Moonbeam Trading & Suppliers"
                    autoFocus
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button type="submit"
                className="w-full bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                Continue
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Credentials */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Org badge */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{orgName}</p>
                <button onClick={() => { setStep(1); setError(""); }} className="text-xs text-teal-600 hover:text-teal-800">
                  Change Organization
                </button>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-2">Sign In</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your credentials to access the billing system</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username" autoFocus className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password" className={`${inputClass} pl-10`} />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50">
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-6">
              Default: admin / admin123
            </p>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? "bg-teal-400" : "bg-slate-600"}`} />
          <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? "bg-teal-400" : "bg-slate-600"}`} />
        </div>
      </div>
    </div>
  );
}
