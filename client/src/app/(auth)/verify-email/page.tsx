"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailLogic() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid or missing verification token.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const apiUrl = "" /* Proxy rewrite in next.config.ts handles backend routing */;
        const res = await fetch(`${apiUrl}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, token }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to verify email");
        }

        setStatus("success");
        if (data.pendingPlan) {
          setMessage("Email successfully verified! Redirecting to checkout...");
          setTimeout(() => {
            router.push(`/checkout?plan=${data.pendingPlan}`);
          }, 2000);
        } else {
          setMessage("Email successfully verified! Redirecting to dashboard...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="glass-card bg-white/90 backdrop-blur-md rounded-xl p-8 md:p-12 border border-outline-variant/50 shadow-sm text-center">
      {status === "loading" && (
        <>
          <div className="w-16 h-16 border-4 border-[#0071E3]/30 border-t-[#0071E3] rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="font-headline-lg text-headline-lg mb-2">Verifying Email...</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Please wait while we confirm your email address.</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-headline-lg text-headline-lg mb-2">Verification Complete</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">{message}</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-headline-lg text-headline-lg mb-2">Verification Failed</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">{message}</p>
          <Link href="/login" className="bg-[#0071E3] text-white font-body-lg px-8 py-3 rounded-lg hover:opacity-90 transition-opacity">
            Return to Log In
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <VerifyEmailLogic />
    </Suspense>
  );
}
