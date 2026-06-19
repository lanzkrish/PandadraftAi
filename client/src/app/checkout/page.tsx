"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

const PLANS: Record<string, { name: string; price: number; credits: string; scheduling: string }> = {
  Starter: { name: "Starter", price: 99, credits: "5 Credits", scheduling: "Upto 15 Days" },
  Creator: { name: "Creator", price: 249, credits: "30 Credits", scheduling: "Upto 30 Days" },
  Growth: { name: "Growth", price: 499, credits: "50 Credits", scheduling: "Upto 60 Days" },
  Pro: { name: "Pro", price: 999, credits: "150 Credits", scheduling: "Upto 180 Days" }
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planName = searchParams.get("plan") || "Growth";
  const plan = PLANS[planName] || PLANS.Growth;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Create order on the server
      const apiUrl = "" /* Proxy rewrite in next.config.ts handles backend routing */;
      const res = await fetch(`${apiUrl}/api/billing/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: plan.name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate transaction");
      }

      // 2. Configure Razorpay Options
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Pandadraft",
        description: `${plan.name} Plan Subscription`,
        image: "https://61c27pvrog.ufs.sh/f/csa5xgP43gu20Ydej7opI3OnUf2APZamuKDqjh75V9FgWecX",
        order_id: data.orderId,
        handler: async function (response: any) {
          setLoading(true);
          try {
            // 3. Verify payment signature on server
            const verifyRes = await fetch(`${apiUrl}/api/billing/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment verification failed");
            }

            setSuccess(true);
            setTimeout(() => {
              router.push("/dashboard");
            }, 2500);
          } catch (err: any) {
            setError(err.message);
            setLoading(false);
          }
        },
        prefill: {
          name: "",
          email: ""
        },
        theme: {
          color: "#0071E3"
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass-card bg-white/90 backdrop-blur-md rounded-xl p-8 md:p-12 border border-outline-variant/50 shadow-sm text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-headline-lg text-headline-lg mb-2">Payment Successful!</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
          Your account has been upgraded to the <strong>{plan.name}</strong> tier. Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card bg-white/90 backdrop-blur-md rounded-xl p-8 md:p-12 border border-outline-variant/50 shadow-sm max-w-md w-full mx-auto">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="text-center mb-8">
        <h1 className="font-headline-lg text-headline-lg mb-2">Checkout</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Complete your subscription to Pandadraft.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg font-body-sm">
          {error}
        </div>
      )}

      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="font-title-lg text-title-lg font-bold text-on-surface">{plan.name} Plan</span>
          <span className="font-display-md text-headline-lg text-primary font-bold">₹{plan.price}</span>
        </div>
        <div className="space-y-2 text-body-sm text-on-surface-variant">
          <div className="flex justify-between">
            <span>Credits Allocation:</span>
            <span className="font-medium text-on-surface">{plan.credits}</span>
          </div>
          <div className="flex justify-between">
            <span>Scheduling Buffer:</span>
            <span className="font-medium text-on-surface">{plan.scheduling}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-[#0071E3] text-white font-body-lg text-body-lg px-8 py-3.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 font-medium"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>

      <div className="text-center mt-4">
        <Link href="/dashboard" className="text-on-surface-variant hover:text-primary text-body-sm hover:underline">
          Skip to Dashboard (Free Plan)
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <Suspense fallback={<div className="p-8 text-center text-on-surface-variant">Loading...</div>}>
        <CheckoutForm />
      </Suspense>
    </div>
  );
}
