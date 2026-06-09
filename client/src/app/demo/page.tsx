import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import React from "react";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center">
      <header className="glass-nav px-8 py-4 flex justify-between items-center w-full sticky top-0 z-50">
        <Logo />
        <Link href="/demo/dashboard">
          <Button variant="primary">Enter App</Button>
        </Link>
      </header>

      <main className="flex-grow w-full max-w-6xl px-4 py-12 flex flex-col gap-16">
        <div className="text-center">
          <h1 className="font-display-lg text-display-md md:text-display-lg text-on-surface mb-4">
            Product Walkthrough
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            See exactly what Pandadraft looks like once you're inside. A minimalist, powerful interface designed to keep you focused on growth.
          </p>
        </div>

        {/* Demo Section 1: Dashboard */}
        <section className="flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">1. The Command Center</h2>
              <p className="font-body-lg text-on-surface-variant">Your birds-eye view of all content performance and AI suggestions.</p>
            </div>
          </div>
          <div className="w-full aspect-[16/9] bg-white/40 backdrop-blur-2xl border border-white/60 rounded-3xl overflow-hidden shadow-2xl relative flex items-center justify-center p-4">
            {/* Embedded Dashboard Component directly for demo, or mock screenshot */}
            <div className="absolute inset-0 bg-gradient-to-br from-tertiary/10 to-primary/10 opacity-50"></div>
            <div className="w-full h-full bg-white rounded-2xl border border-outline-variant/20 shadow-inner flex flex-col">
              <div className="h-12 border-b border-outline-variant/20 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-error"></div>
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <div className="w-3 h-3 rounded-full bg-tertiary"></div>
              </div>
              <div className="flex-grow flex items-center justify-center text-on-surface-variant font-body-lg">
                <Link href="/dashboard">
                  <Button variant="glass">Interactive Dashboard Live</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section 2: Editor */}
        <section className="flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">2. Distraction-Free Editor</h2>
              <p className="font-body-lg text-on-surface-variant">Write, refine, and preview your posts exactly as they'll appear on LinkedIn.</p>
            </div>
          </div>
          <div className="w-full aspect-[16/9] bg-white/40 backdrop-blur-2xl border border-white/60 rounded-3xl overflow-hidden shadow-2xl relative flex items-center justify-center p-4">
             <div className="w-full h-full bg-white rounded-2xl border border-outline-variant/20 shadow-inner flex items-center justify-center">
                 <p className="text-on-surface-variant italic font-body-lg text-lg">Editor Preview Coming Soon</p>
             </div>
          </div>
        </section>
      </main>
    </div>
  );
}
