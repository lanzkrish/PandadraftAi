"use client";

import React from "react";

export default function SettingsPage() {
  return (
    <>
      {/* Header */}
      <header className="mb-10 flex justify-between items-end border-b border-outline-variant/30 pb-6">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 tracking-tight">Settings</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Manage your account settings and preferences.</p>
        </div>
        {/* Desktop Top Actions (Mirrors TopNavBar functionality) */}
        <div className="hidden md:flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full ring-2 ring-background"></span>
          </button>
          <img 
            alt="User profile" 
            className="w-10 h-10 rounded-full border border-outline-variant/30 cursor-pointer object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6Li-aOZ57ZCGo3u9pOc0KogMji2Y-bF_nuIAPHXJkVSEd8yeviyEmD-BxO1R-1i3yGmbQVEsiCT1CWGLaNwK2N0wFs4clDFSqmVpP_nCMpspmhS8mKvTnRdQ1HTBDfU12kgDc701PMlMVpPmsdtDBBpxwl3iMQwtfneRc1kuQRz-IcDPsECFv_tdeDxBlh6OFvD1QgG62uZ1ox1XoPBjml_6PCAd-HdXL-GG4JVNNPvNAnuW_A0N8O1hMyEbZZIoOKJ_YgNZ0zgQ" 
          />
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Settings Navigation */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 sticky top-24">
            <a className="flex-shrink-0 px-4 py-2.5 bg-white text-on-surface font-bold rounded-lg border border-outline-variant/50 shadow-sm font-label-md text-label-md" href="#profile">
              Profile
            </a>
            <a className="flex-shrink-0 px-4 py-2.5 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors font-label-md text-label-md" href="#connections">
              Connections
            </a>
            <a className="flex-shrink-0 px-4 py-2.5 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors font-label-md text-label-md" href="#preferences">
              Content Preferences
            </a>
            <a className="flex-shrink-0 px-4 py-2.5 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors font-label-md text-label-md" href="#billing">
              Billing
            </a>
            <a className="flex-shrink-0 px-4 py-2.5 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors font-label-md text-label-md" href="#notifications">
              Notifications
            </a>
          </nav>
        </aside>

        {/* Settings Content Sections */}
        <div className="flex-grow space-y-16 max-w-3xl">
          {/* Profile Section */}
          <section className="scroll-mt-24" id="profile">
            <div className="mb-6">
              <h2 className="font-title-lg text-title-lg text-on-surface mb-1">Profile Settings</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Update your personal details and public profile.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-outline-variant/50 shadow-sm">
              <div className="flex items-center gap-6 mb-10 pb-8 border-b border-outline-variant/30">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-outline-variant to-surface-container-low">
                    <img 
                      alt="User avatar" 
                      className="w-full h-full rounded-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6Li-aOZ57ZCGo3u9pOc0KogMji2Y-bF_nuIAPHXJkVSEd8yeviyEmD-BxO1R-1i3yGmbQVEsiCT1CWGLaNwK2N0wFs4clDFSqmVpP_nCMpspmhS8mKvTnRdQ1HTBDfU12kgDc701PMlMVpPmsdtDBBpxwl3iMQwtfneRc1kuQRz-IcDPsECFv_tdeDxBlh6OFvD1QgG62uZ1ox1XoPBjml_6PCAd-HdXL-GG4JVNNPvNAnuW_A0N8O1hMyEbZZIoOKJ_YgNZ0zgQ" 
                    />
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white border border-outline-variant rounded-full p-2 shadow-md hover:bg-surface-container-low transition-colors group-hover:scale-105">
                    <span className="material-symbols-outlined text-[18px] text-on-surface">edit</span>
                  </button>
                </div>
                <div>
                  <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Avatar</h3>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm">Change</button>
                    <button className="px-4 py-2 text-error font-label-md text-label-md hover:bg-error-container/50 rounded-lg transition-colors">Remove</button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant ml-1">First Name</label>
                  <input 
                    className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all" 
                    type="text" 
                    defaultValue="Alex"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant ml-1">Last Name</label>
                  <input 
                    className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all" 
                    type="text" 
                    defaultValue="Morgan"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface-variant ml-1">Email Address</label>
                  <input 
                    className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all" 
                    type="email" 
                    defaultValue="alex.morgan@example.com"
                  />
                </div>
              </div>
              
              <div className="mt-10 flex justify-end">
                <button className="px-6 py-3 bg-[#0071E3] text-white rounded-xl font-label-md text-label-md hover:opacity-90 transition-opacity shadow-sm font-medium">Save Changes</button>
              </div>
            </div>
          </section>

          {/* LinkedIn Connection */}
          <section className="scroll-mt-24" id="connections">
            <div className="mb-6">
              <h2 className="font-title-lg text-title-lg text-on-surface mb-1">Connections</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Manage your connected social accounts.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-outline-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-shadow">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-[#0A66C2] rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                  <span className="font-display-md text-[28px] font-bold">in</span>
                </div>
                <div>
                  <h3 className="font-title-lg text-title-lg font-semibold text-on-surface mb-1">LinkedIn</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Connected as Alex Morgan</p>
                </div>
              </div>
              <div className="flex items-center gap-4 border-t md:border-t-0 border-outline-variant/30 pt-4 md:pt-0">
                <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/50">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34C759] opacity-40"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#34C759]"></span>
                  </span>
                  <span className="font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">Active</span>
                </div>
                <button className="px-4 py-2 bg-white border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm">Disconnect</button>
              </div>
            </div>
          </section>

          {/* Billing Section */}
          <section className="scroll-mt-24" id="billing">
            <div className="mb-6">
              <h2 className="font-title-lg text-title-lg text-on-surface mb-1">Billing & Subscription</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Manage your plan and payment methods.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-outline-variant/50 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-outline-variant/30 bg-gradient-to-br from-white to-surface-container-low/30">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Pro Plan</h3>
                      <span className="px-2.5 py-1 bg-[#0071E3]/10 text-[#0071E3] rounded-full font-label-md text-[11px] uppercase tracking-wider font-bold">Current</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">$29/month. Next billing date: Oct 15, 2024</p>
                  </div>
                  <button className="px-5 py-2.5 bg-white border border-outline-variant rounded-xl font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm font-medium whitespace-nowrap">Manage Subscription</button>
                </div>
              </div>
              
              <div className="p-8 bg-surface-container-low/50">
                <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-4 ml-1">Payment Method</h4>
                <div className="p-5 bg-white rounded-xl border border-outline-variant/50 flex items-center justify-between shadow-sm hover:border-outline-variant transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-surface-container-low rounded border border-outline-variant/50 flex items-center justify-center relative overflow-hidden">
                      <div className="font-bold text-[10px] text-[#0071E3] italic">VISA</div>
                    </div>
                    <div>
                      <p className="font-body-sm text-body-sm text-on-surface font-medium mb-0.5">Visa ending in 4242</p>
                      <p className="font-label-md text-label-md text-on-surface-variant">Expires 12/25</p>
                    </div>
                  </div>
                  <button className="text-[#0071E3] font-label-md text-label-md hover:underline font-medium px-2 py-1 rounded hover:bg-[#0071E3]/5 transition-colors">Edit</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
