import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Abstract Glassmorphism Backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-tertiary/10 blur-[120px] -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] -z-10"></div>
      <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] rounded-full bg-secondary/10 blur-[100px] -z-10 -translate-x-1/2"></div>

      {/* Header */}
      <header className="glass-nav px-4 sm:px-8 py-4 flex justify-between items-center w-full gap-2">
        <Logo className="shrink-0" />
        <div className="flex gap-2 sm:gap-4 items-center shrink-0">
          <Link href="/demo" className="text-on-surface-variant hover:text-tertiary font-label-md font-medium transition-colors whitespace-nowrap">
            View Demo
          </Link>
          <Link href="/dashboard">
            <Button variant="primary" className="whitespace-nowrap px-4 py-2 text-sm">Login</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-20 text-center z-10">
        <Badge className="mb-6">v2.0 Early Access</Badge>
        <h1 className="font-display-lg text-display-md md:text-display-lg text-on-surface mb-6 max-w-4xl tracking-tight leading-tight">
          Automate your LinkedIn growth with <span className="text-tertiary text-transparent bg-clip-text bg-gradient-to-r from-tertiary to-primary">Precision & Style.</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl">
          Pandadraft is the premium AI SaaS designed for professionals. Scale your personal brand without sacrificing authenticity or aesthetic.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/dashboard">
            <Button size="lg" variant="primary" className="w-full sm:w-auto shadow-xl shadow-tertiary/20">
              Start Building Free
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="glass" className="w-full sm:w-auto">
              View Live Demo
            </Button>
          </Link>
        </div>

        {/* Feature Cards Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full text-left">
          <Card className="hover:-translate-y-2">
            <div className="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center mb-6">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <h3 className="font-title-lg text-title-lg mb-2">Contextual AI</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Our models don't just write; they learn your voice and generate posts tailored to your exact industry context.
            </p>
          </Card>
          <Card className="hover:-translate-y-2">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-6">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <h3 className="font-title-lg text-title-lg mb-2">Smart Scheduling</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Visually plan your week with an elegant, drag-and-drop calendar interface built for high-volume creators.
            </p>
          </Card>
          <Card className="hover:-translate-y-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <h3 className="font-title-lg text-title-lg mb-2">Deep Analytics</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Track your reach, impressions, and engagement rate with pixel-perfect data visualization.
            </p>
          </Card>
        </div>

        {/* Product Mockup Preview */}
        <div className="w-full max-w-5xl mx-auto mt-20 mb-32 relative group text-left z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-tertiary/5 to-transparent rounded-[2rem] -m-4 sm:-m-8 z-0"></div>
          <div className="relative z-10 glass-card rounded-2xl overflow-hidden border border-outline-variant/30 shadow-[0_12px_40px_rgba(0,0,0,0.08)] aspect-video flex flex-col bg-surface-container-lowest">
            {/* Fake Window Header */}
            <div className="h-12 border-b border-outline-variant/20 flex items-center px-4 gap-2 bg-surface-container-low/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-outline-variant/50"></div>
                <div className="w-3 h-3 rounded-full bg-outline-variant/50"></div>
                <div className="w-3 h-3 rounded-full bg-outline-variant/50"></div>
              </div>
              <div className="mx-auto flex items-center gap-2 bg-surface-container-highest/30 px-3 py-1 rounded-md">
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">lock</span>
                <span className="font-label-md text-[10px] text-on-surface-variant">app.pandadraft.com</span>
              </div>
            </div>
            {/* Fake Dashboard Body */}
            <div className="flex-1 p-6 flex gap-6 bg-surface-bright bg-[radial-gradient(#e5e2e1_1px,transparent_1px)] [background-size:16px_16px]">
              {/* Fake Sidebar */}
              <div className="w-48 hidden md:flex flex-col gap-3">
                <div className="h-8 bg-surface-container-high rounded-md w-full opacity-70"></div>
                <div className="h-8 bg-surface-container-highest rounded-md w-3/4"></div>
                <div className="h-8 bg-surface-container-high rounded-md w-5/6 opacity-70"></div>
                <div className="h-8 bg-surface-container-high rounded-md w-full opacity-70 mt-auto"></div>
              </div>
              {/* Fake Content Area */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-surface-container-highest rounded w-48"></div>
                  <div className="h-8 w-24 bg-tertiary/20 rounded-full"></div>
                </div>
                <div className="flex-1 bg-primary-container rounded-xl border border-outline-variant/20 p-4 shadow-sm flex flex-col gap-4">
                  <div className="h-4 bg-surface-container-highest rounded w-3/4"></div>
                  <div className="h-4 bg-surface-container-highest rounded w-full"></div>
                  <div className="h-4 bg-surface-container-highest rounded w-5/6"></div>
                  <div className="mt-auto flex gap-2">
                    <div className="h-8 w-8 bg-surface-container-high rounded-full"></div>
                    <div className="h-8 w-8 bg-surface-container-high rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="w-full max-w-[90rem] mx-auto text-center mb-16 z-10 px-4">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Simple, transparent pricing</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-12">Invest in your personal brand. Cancel anytime.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 text-left">
            {/* Free Tier */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <h3 className="font-title-lg text-title-lg text-on-surface">Free</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Try out the platform.</p>
                </div>
                <div className="my-6">
                  <span className="font-display-md text-display-md text-on-surface">₹0</span>
                  <span className="font-body-sm text-on-surface-variant">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 font-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                    2 Credits
                  </li>
                  <li className="flex items-center gap-2 font-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                    Schedule up to 2 Days
                  </li>
                  <li className="flex items-center gap-2 font-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                    Basic Scheduling
                  </li>
                </ul>
              </div>
              <Link href="/signup?plan=Free" className="w-full">
                <button className="w-full py-3 bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg font-label-md hover:bg-surface-container-low transition-colors">Get Started</button>
              </Link>
            </div>

            {/* Starter Tier */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <h3 className="font-title-lg text-title-lg text-on-surface">Starter</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Basic scheduling tools.</p>
                </div>
                <div className="my-6">
                  <span className="font-display-md text-display-md text-on-surface">₹99</span>
                  <span className="font-body-sm text-on-surface-variant">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 font-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                    5 Credits
                  </li>
                  <li className="flex items-center gap-2 font-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                    Schedule up to 15 Days
                  </li>
                  <li className="flex items-center gap-2 font-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                    LinkedIn Scheduling
                  </li>
                </ul>
              </div>
              <Link href="/signup?plan=Starter" className="w-full">
                <button className="w-full py-3 bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg font-label-md hover:bg-surface-container-low transition-colors">Get Started</button>
              </Link>
            </div>

            {/* Creator Tier */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <h3 className="font-title-lg text-title-lg text-on-surface">Creator</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">For regular writers.</p>
                </div>
                <div className="my-6">
                  <span className="font-display-md text-display-md text-on-surface">₹249</span>
                  <span className="font-body-sm text-on-surface-variant">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 font-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                    30 Credits
                  </li>
                  <li className="flex items-center gap-2 font-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                    Schedule up to 30 Days
                  </li>
                  <li className="flex items-center gap-2 font-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                    AI Post Generation
                  </li>
                </ul>
              </div>
              <Link href="/signup?plan=Creator" className="w-full">
                <button className="w-full py-3 bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg font-label-md hover:bg-surface-container-low transition-colors">Get Started</button>
              </Link>
            </div>

            {/* Growth Tier */}
            <div className="bg-on-surface text-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
              <span className="absolute top-3 right-4 bg-tertiary text-on-tertiary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10">Popular</span>
              <div>
                <div className="mb-4 mt-2 relative z-10">
                  <h3 className="font-title-lg text-title-lg text-surface-container-lowest">Growth</h3>
                  <p className="font-body-sm text-body-sm text-surface-container-lowest/70 mt-1">Accelerate your brand.</p>
                </div>
                <div className="my-6 relative z-10">
                  <span className="font-display-md text-display-md text-surface-container-lowest">₹499</span>
                  <span className="font-body-sm text-surface-container-lowest/70">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 relative z-10">
                  <li className="flex items-center gap-2 font-body-sm text-surface-container-lowest">
                    <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">check_circle</span>
                    50 Credits
                  </li>
                  <li className="flex items-center gap-2 font-body-sm text-surface-container-lowest">
                    <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">check_circle</span>
                    Schedule up to 60 Days
                  </li>
                  <li className="flex items-center gap-2 font-body-sm text-surface-container-lowest">
                    <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">check_circle</span>
                    AI Suggestions + Calendar
                  </li>
                </ul>
              </div>
              <Link href="/signup?plan=Growth" className="w-full">
                <button className="w-full py-3 bg-tertiary text-on-tertiary rounded-lg font-label-md hover:opacity-90 transition-opacity relative z-10">Start Trial</button>
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <h3 className="font-title-lg text-title-lg text-on-surface">Pro</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">The ultimate tool suite.</p>
                </div>
                <div className="my-6">
                  <span className="font-display-md text-display-md text-on-surface">₹999</span>
                  <span className="font-body-sm text-on-surface-variant">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 font-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                    150 Credits
                  </li>
                  <li className="flex items-center gap-2 font-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                    Schedule up to 180 Days
                  </li>
                  <li className="flex items-center gap-2 font-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                    Advanced AI + Priority Queue
                  </li>
                </ul>
              </div>
              <Link href="/signup?plan=Pro" className="w-full">
                <button className="w-full py-3 bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg font-label-md hover:bg-surface-container-low transition-colors">Get Started</button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto border-t border-outline-variant/10 bg-surface-bright relative z-10">
        <div className="font-display-md text-[20px] font-bold text-on-surface mb-4 md:mb-0">
          Pandadraft
        </div>
        <div className="font-body-sm text-body-sm text-on-secondary-container mb-4 md:mb-0">
          © 2024 Pandadraft. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a href="#" className="font-body-sm text-body-sm text-on-secondary-container hover:text-tertiary transition-colors opacity-80 hover:opacity-100">Privacy Policy</a>
          <a href="#" className="font-body-sm text-body-sm text-on-secondary-container hover:text-tertiary transition-colors opacity-80 hover:opacity-100">Terms of Service</a>
          <a href="#" className="font-body-sm text-body-sm text-on-secondary-container hover:text-tertiary transition-colors opacity-80 hover:opacity-100">Help Center</a>
        </div>
      </footer>
    </div>
  );
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full font-label-md text-xs uppercase tracking-wider bg-white/40 border border-white/60 text-tertiary backdrop-blur-md shadow-sm ${className}`}>
      {children}
    </span>
  );
}
