"use client";

import React, { useEffect, useState } from "react";
import { CircularProgress } from "@/components/ui/CircularProgress";
import Script from "next/script";

const PLANS = [
  { name: "Starter", price: 99, credits: "5 Credits", scheduling: "Upto 15 Days", description: "Basic scheduling tools." },
  { name: "Creator", price: 249, credits: "30 Credits", scheduling: "Upto 30 Days", description: "For regular writers." },
  { name: "Growth", price: 499, credits: "50 Credits", scheduling: "Upto 60 Days", description: "Accelerate your brand.", popular: true },
  { name: "Pro", price: 999, credits: "150 Credits", scheduling: "Upto 180 Days", description: "The ultimate tool suite." }
];

export function SubscribeView({ isDemo = false }: { isDemo?: boolean }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(!isDemo);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchUser = () => {
    if (isDemo) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
    fetch(`${apiUrl}/api/auth/me`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setUser(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isDemo) {
      setUser({
        name: "Demo User",
        email: "demo@pandadraft.ai",
        plan: "Free",
        credits: 2,
        max_credits: 2
      });
      setLoading(false);
    } else {
      fetchUser();
    }
  }, [isDemo]);

  const handleSubscribe = async (planName: string) => {
    if (isDemo) {
      alert("Checkout is disabled in demo mode.");
      return;
    }
    setIsProcessing(true);
    setError("");
    setSuccessMessage("");

    try {
      // 1. Create order
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
      const res = await fetch(`${apiUrl}/api/billing/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: planName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate payment");
      }

      // 2. Open Razorpay modal
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Pandadraft",
        description: `${planName} Plan Subscription`,
        image: "https://61c27pvrog.ufs.sh/f/csa5xgP43gu20Ydej7opI3OnUf2APZamuKDqjh75V9FgWecX",
        order_id: data.orderId,
        handler: async function (response: any) {
          setIsProcessing(true);
          try {
            // 3. Verify signature
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
              throw new Error(verifyData.error || "Verification failed");
            }

            setSuccessMessage(`Successfully updated subscription to ${planName}!`);
            setIsProcessing(false);
            fetchUser(); // Refresh plan info
          } catch (err: any) {
            setError(err.message);
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || ""
        },
        theme: {
          color: "#0071E3"
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center w-full h-full text-on-surface-variant font-body-lg">
        <CircularProgress value={0} size={48} className="animate-spin mr-4" />
        Loading subscription data...
      </div>
    );
  }

  const activePlan = user?.plan || "Free";

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <header className="mb-10 border-b border-outline-variant/30 pb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 tracking-tight">Subscriptions</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Upgrade, downgrade, or manage your billing details.</p>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-error-container text-on-error-container rounded-xl font-body-sm max-w-3xl">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-8 p-4 bg-green-100 text-green-800 rounded-xl font-body-sm max-w-3xl">
          {successMessage}
        </div>
      )}

      <div className="max-w-4xl space-y-10">
        {/* Current Plan Overview Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-outline-variant/50 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-outline-variant/30 bg-gradient-to-br from-white to-surface-container-low/30">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">{activePlan} Plan</h2>
                  <span className="px-2.5 py-1 bg-[#0071E3]/10 text-[#0071E3] rounded-full font-label-md text-[11px] uppercase tracking-wider font-bold">Active</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {activePlan === "Free" 
                    ? "2 Credits per month, up to 2 days scheduling buffer." 
                    : `${PLANS.find(p => p.name === activePlan)?.credits} per month.`}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method section (only for anything other than Free plan) */}
          {activePlan !== "Free" && (
            <div className="p-8 bg-surface-container-low/30 border-t border-outline-variant/20">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-4">Payment Method Used</h3>
              <div className="p-5 bg-white rounded-xl border border-outline-variant/50 flex items-center justify-between shadow-sm max-w-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-surface-container-low rounded border border-outline-variant/50 flex items-center justify-center">
                    <div className="font-bold text-[10px] text-[#0071E3] italic">VISA</div>
                  </div>
                  <div>
                    <p className="font-body-sm text-body-sm text-on-surface font-medium mb-0.5">Visa ending in 4242</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">Used to purchase {activePlan} plan</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Plan Upgrade / Subscription Options */}
        <div>
          <h2 className="font-title-lg text-title-lg text-on-surface mb-6">Available Subscription Plans</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {PLANS.map((plan) => {
              const isCurrent = activePlan === plan.name;
              return (
                <div 
                  key={plan.name}
                  className={`rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                    plan.popular 
                      ? "bg-on-surface text-surface-container-lowest border-primary/50 shadow-md scale-[1.02] md:scale-100 lg:scale-[1.02] relative" 
                      : "bg-white text-on-surface border-outline-variant/30 shadow-sm"
                  } ${isCurrent ? "opacity-75" : ""}`}
                >
                  {plan.popular && (
                    <span className="absolute top-3 right-4 bg-tertiary text-on-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Popular</span>
                  )}
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-title-lg text-title-lg font-semibold ${plan.popular ? "text-surface-container-lowest" : "text-on-surface"}`}>{plan.name}</h3>
                    </div>
                    <p className={`font-body-sm text-body-sm mb-4 ${plan.popular ? "text-surface-container-lowest/70" : "text-on-surface-variant"}`}>{plan.description}</p>
                    <div className="my-4">
                      <span className={`font-display-md text-display-md ${plan.popular ? "text-surface-container-lowest" : "text-on-surface"}`}>₹{plan.price}</span>
                      <span className={`font-body-sm ${plan.popular ? "text-surface-container-lowest/70" : "text-on-surface-variant"}`}>/mo</span>
                    </div>
                    <ul className={`space-y-2 mb-6 text-body-sm ${plan.popular ? "text-surface-container-lowest" : "text-on-surface"}`}>
                      <li className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[16px] ${plan.popular ? "text-tertiary-fixed-dim" : "text-tertiary"}`}>check_circle</span>
                        {plan.credits}
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[16px] ${plan.popular ? "text-tertiary-fixed-dim" : "text-tertiary"}`}>check_circle</span>
                        Schedule {plan.scheduling}
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={isCurrent || isProcessing}
                    className={`w-full py-2.5 rounded-xl font-label-md text-label-md transition-all font-medium ${
                      isCurrent
                        ? "bg-surface-container-high text-on-surface-variant cursor-default"
                        : plan.popular 
                        ? "bg-tertiary text-on-tertiary hover:opacity-95 shadow-sm animate-pulse-subtle"
                        : "bg-white border border-outline-variant text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    {isCurrent ? "Current Plan" : (plan.popular ? "Start Trial" : "Subscribe")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
