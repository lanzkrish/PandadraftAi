"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to login");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card bg-white/90 backdrop-blur-md rounded-xl p-8 md:p-12 border border-outline-variant/50 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-[#0071E3]/20">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg mb-2">Welcome back.</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Log in to continue to your dashboard.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg font-body-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="font-label-md text-label-md text-on-surface">Email Address</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-3 font-body-lg text-body-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all" 
            placeholder="name@company.com" 
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="font-label-md text-label-md text-on-surface">Password</label>
            <Link href="/forgot-password" className="font-label-md text-[#0071E3] hover:underline">Forgot password?</Link>
          </div>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-3 font-body-lg text-body-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all" 
            placeholder="••••••••" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#0071E3] text-white font-body-lg text-body-lg px-8 py-3 rounded-lg hover:opacity-90 transition-opacity shadow-sm mt-4 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-center font-body-sm text-on-surface-variant mt-6">
          Don't have an account? <Link href="/signup" className="text-[#0071E3] hover:underline font-medium">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
