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
  
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const apiUrl = "" /* Proxy rewrite in next.config.ts handles backend routing */;
      const res = await fetch(`${apiUrl}/api/billing/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: plan.name, couponCode: couponInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to validate coupon");
      setAppliedCoupon(data);
    } catch (err: any) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

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
        body: JSON.stringify({ plan: plan.name, couponCode: appliedCoupon ? appliedCoupon.coupon : undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate transaction");
      }

      if (data.isFree) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2500);
        return;
      }

      // 2. Configure Razorpay Options
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "TacoDraft",
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
        <p className="font-body-lg text-body-lg text-on-surface-variant">Complete your subscription to TacoDraft.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg font-body-sm">
          {error}
        </div>
      )}

      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="font-title-lg text-title-lg font-bold text-on-surface">{plan.name} Plan</span>
          <div className="text-right">
            {appliedCoupon && <span className="font-title-md text-on-surface-variant line-through mr-2 text-[14px]">₹{plan.price}</span>}
            <span className="font-display-md text-headline-lg text-primary font-bold">₹{appliedCoupon ? appliedCoupon.final_price : plan.price}</span>
          </div>
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

      <div className="mb-8">
        <label className="block font-label-md text-on-surface-variant mb-2">Coupon Code</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="flex-1 bg-surface border border-outline-variant rounded-lg px-4 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
            disabled={!!appliedCoupon || couponLoading}
          />
          {appliedCoupon ? (
            <button 
              onClick={() => { setAppliedCoupon(null); setCouponInput(""); }}
              className="bg-error-container text-on-error-container px-4 py-2 rounded-lg font-label-md transition-opacity hover:opacity-90"
            >
              Remove
            </button>
          ) : (
            <button 
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponInput.trim()}
              className="bg-surface-container-high text-on-surface px-4 py-2 rounded-lg font-label-md transition-opacity hover:bg-surface-container disabled:opacity-50"
            >
              Apply
            </button>
          )}
        </div>
        {couponError && <p className="text-error text-[12px] mt-2">{couponError}</p>}
        {appliedCoupon && <p className="text-green-600 text-[12px] mt-2 font-medium">Coupon {appliedCoupon.coupon} applied! {appliedCoupon.discount_percentage}% off.</p>}
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
