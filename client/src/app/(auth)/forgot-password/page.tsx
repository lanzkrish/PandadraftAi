"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5001/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      setMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card bg-white/90 backdrop-blur-md rounded-xl p-8 md:p-12 border border-outline-variant/50 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-[#0071E3]/20">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg mb-2">Reset your password.</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Enter your email and we'll send you a link to get back into your account.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg font-body-sm">
          {error}
        </div>
      )}

      {message ? (
        <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg font-body-sm border border-green-200">
          {message}
          <div className="mt-4">
            <Link href="/login" className="text-[#0071E3] hover:underline font-medium">Return to log in</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#0071E3] text-white font-body-lg text-body-lg px-8 py-3 rounded-lg hover:opacity-90 transition-opacity shadow-sm mt-4 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <p className="text-center font-body-sm text-on-surface-variant mt-6">
            Remember your password? <Link href="/login" className="text-[#0071E3] hover:underline font-medium">Log in</Link>
          </p>
        </form>
      )}
    </div>
  );
}
