"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "Free";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = "" /* Proxy rewrite in next.config.ts handles backend routing */;
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, linkedinProfile, password, plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sign up");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass-card bg-white/90 backdrop-blur-md rounded-xl p-8 md:p-12 border border-outline-variant/50 shadow-sm text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="font-headline-lg text-headline-lg mb-4">Check your email</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
          We've sent a verification link to <strong>{email}</strong>. Please click the link to verify your account and log in.
        </p>
        <Link href="/login" className="text-[#0071E3] hover:underline font-medium">Return to log in</Link>
      </div>
    );
  }

  return (
    <div className="glass-card bg-white/90 backdrop-blur-md rounded-xl p-8 md:p-12 border border-outline-variant/50 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-[#0071E3]/20">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg mb-2">Create an account.</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Tell us a bit about who you are to tailor the TacoDraft experience.</p>
        {plan && plan !== "Free" && (
          <div className="mt-3 px-3 py-1.5 bg-[#0071E3]/10 text-[#0071E3] rounded-lg font-label-md text-xs font-bold inline-block">
            Selected Plan: {plan}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg font-body-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="font-label-md text-label-md text-on-surface">Full Name</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-3 font-body-lg text-body-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all" 
            placeholder="Jane Doe" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <label className="font-label-md text-label-md text-on-surface">Password</label>
            <input 
              type="password" 
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-3 font-body-lg text-body-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all" 
              placeholder="Min. 8 characters" 
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-label-md text-label-md text-on-surface">LinkedIn Profile URL</label>
          <input 
            type="url" 
            value={linkedinProfile}
            onChange={(e) => setLinkedinProfile(e.target.value)}
            className="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-3 font-body-lg text-body-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all" 
            placeholder="https://linkedin.com/in/janedoe" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#0071E3] text-white font-body-lg text-body-lg px-8 py-3 rounded-lg hover:opacity-90 transition-opacity shadow-sm mt-4 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-center font-body-sm text-on-surface-variant mt-6">
          Already have an account? <Link href="/login" className="text-[#0071E3] hover:underline font-medium">Log in</Link>
        </p>
      </form>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-on-surface-variant">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
