"use client";

import React, { useEffect, useState, useRef } from "react";
import { CircularProgress } from "@/components/ui/CircularProgress";
import Link from "next/link";

export function SettingsView({ isDemo = false }: { isDemo?: boolean }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(!isDemo);
  const [isSaving, setIsSaving] = useState(false);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadError("");
      setUploadSuccess("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const formData = new FormData();
    formData.append("avatar", selectedFile);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
      const res = await fetch(`${apiUrl}/api/dashboard/upload-avatar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload avatar");
      }

      setUser({ ...user, avatar_url: data.avatarUrl, avatar_last_changed: data.avatarLastChanged });
      setUploadSuccess("Profile picture updated successfully!");
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (isDemo) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
    
    // Fetch user settings
    fetch(`${apiUrl}/api/dashboard/settings`, { credentials: "include" })
      .then(res => res.json())
      .then(json => {
        setUser(json);
        
        // Fetch LinkedIn status
        if (json._id) {
          fetch(`${apiUrl}/auth/status?user=${json._id}`)
            .then(res => res.json())
            .then(statusData => {
              setIsLinkedInConnected(!!statusData.authorized);
            })
            .catch(err => console.error("Failed to fetch LinkedIn status", err))
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to fetch settings", err);
        setLoading(false);
      });
  }, [isDemo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDemo) return;
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (isDemo) return;
    setIsSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
      const res = await fetch(`${apiUrl}/api/dashboard/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(user)
      });
      if (res.ok) {
        // optionally show a toast
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center w-full h-full text-on-surface-variant font-body-lg">
        <CircularProgress value={0} size={48} className="animate-spin mr-4" />
        Loading settings...
      </div>
    );
  }

  const displayUser = isDemo ? {
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
  } : (user || {});

  const [firstName, lastName] = (displayUser.name || "").split(" ");

  return (
    <>
      {/* Header */}
      <header className="mb-10 flex justify-between items-end border-b border-outline-variant/30 pb-6">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 tracking-tight">Settings</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Manage your account settings and preferences.</p>
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
              {uploadSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl font-body-sm">
                  {uploadSuccess}
                </div>
              )}
              {uploadError && (
                <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl font-body-sm">
                  {uploadError}
                </div>
              )}
              
              <div className="flex items-center gap-6 mb-10 pb-8 border-b border-outline-variant/30">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-outline-variant to-surface-container-low">
                    <img 
                      alt="User avatar" 
                      className="w-full h-full rounded-full object-cover" 
                      src={previewUrl || displayUser.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuB6Li-aOZ57ZCGo3u9pOc0KogMji2Y-bF_nuIAPHXJkVSEd8yeviyEmD-BxO1R-1i3yGmbQVEsiCT1CWGLaNwK2N0wFs4clDFSqmVpP_nCMpspmhS8mKvTnRdQ1HTBDfU12kgDc701PMlMVpPmsdtDBBpxwl3iMQwtfneRc1kuQRz-IcDPsECFv_tdeDxBlh6OFvD1QgG62uZ1ox1XoPBjml_6PCAd-HdXL-GG4JVNNPvNAnuW_A0N8O1hMyEbZZIoOKJ_YgNZ0zgQ"} 
                    />
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-white border border-outline-variant rounded-full p-2 shadow-md hover:bg-surface-container-low transition-colors group-hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface">edit</span>
                  </button>
                </div>
                <div>
                  <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Avatar</h3>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
              
              {selectedFile && (
                <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-body-sm max-w-md shadow-sm">
                  <p className="font-semibold flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    15-Day Limit Warning
                  </p>
                  <p className="text-[13px] leading-relaxed">
                    You can only update your profile picture once every 15 days. Are you sure you want to upload this photo?
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="px-4 py-1.5 bg-[#0071E3] hover:opacity-90 transition-opacity text-white rounded-lg font-label-md text-xs font-semibold disabled:opacity-50"
                    >
                      {uploading ? "Uploading..." : "Confirm & Upload"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      disabled={uploading}
                      className="px-4 py-1.5 bg-white border border-outline-variant hover:bg-surface-container-low text-on-surface rounded-lg font-label-md text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant ml-1">First Name</label>
                  <input 
                    name="name"
                    className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all" 
                    type="text" 
                    value={isDemo ? "Alex" : (firstName || "")}
                    onChange={(e) => {
                      if (!isDemo) {
                        const newName = `${e.target.value} ${lastName || ""}`.trim();
                        setUser({ ...user, name: newName });
                      }
                    }}
                    disabled={isDemo}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant ml-1">Last Name</label>
                  <input 
                    className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all" 
                    type="text" 
                    value={isDemo ? "Morgan" : (lastName || "")}
                    onChange={(e) => {
                      if (!isDemo) {
                        const newName = `${firstName || ""} ${e.target.value}`.trim();
                        setUser({ ...user, name: newName });
                      }
                    }}
                    disabled={isDemo}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface-variant ml-1">Email Address</label>
                  <input 
                    name="email"
                    className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all" 
                    type="email" 
                    value={displayUser.email || ""}
                    onChange={handleChange}
                    disabled={isDemo}
                  />
                </div>
              </div>
              
              <div className="mt-10 flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={isDemo || isSaving}
                  className="px-6 py-3 bg-[#0071E3] text-white rounded-xl font-label-md text-label-md hover:opacity-90 transition-opacity shadow-sm font-medium disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
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
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Connected as {displayUser.name || "User"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 border-t md:border-t-0 border-outline-variant/30 pt-4 md:pt-0">
                {isLinkedInConnected ? (
                  <>
                    <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/50">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34C759] opacity-40"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#34C759]"></span>
                      </span>
                      <span className="font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">Active</span>
                    </div>
                    {/* Disconnect is not implemented yet, just visual */}
                    <button className="px-4 py-2 bg-white border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm">Disconnect</button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/50">
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error"></span>
                      <span className="font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">Disconnected</span>
                    </div>
                    <a 
                      href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005"}/auth/linkedin?user=${user?._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#0A66C2] text-white rounded-lg font-label-md text-label-md hover:bg-[#004182] transition-colors shadow-sm"
                    >
                      Connect
                    </a>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Billing Section */}
          <section className="scroll-mt-24" id="billing">
            <div className="mb-6">
              <h2 className="font-title-lg text-title-lg text-on-surface mb-1">Billing & Subscription</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Manage your plan and payment methods.</p>
            </div>
            
            {(() => {
              const activePlan = (displayUser.plan || "Free") as string;
              const planDetailsMap: Record<string, { price: string; details: string }> = {
                Free: { price: "₹0/month", details: "2 Credits per month, up to 2 days scheduling buffer." },
                Starter: { price: "₹99/month", details: "5 Credits per month, up to 15 days scheduling buffer." },
                Creator: { price: "₹249/month", details: "30 Credits per month, up to 30 days scheduling buffer." },
                Growth: { price: "₹499/month", details: "50 Credits per month, up to 60 days scheduling buffer." },
                Pro: { price: "₹999/month", details: "150 Credits per month, up to 180 days scheduling buffer." },
              };
              const planDetails = planDetailsMap[activePlan] || planDetailsMap.Free;

              return (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-outline-variant/50 overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-outline-variant/30 bg-gradient-to-br from-white to-surface-container-low/30">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">{activePlan} Plan</h3>
                          <span className="px-2.5 py-1 bg-[#0071E3]/10 text-[#0071E3] rounded-full font-label-md text-[11px] uppercase tracking-wider font-bold">Current</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {planDetails.price}. {planDetails.details}
                        </p>
                      </div>
                      <Link href={isDemo ? "/demo/dashboard/subscribe" : "/dashboard/subscribe"}>
                        <button className="px-5 py-2.5 bg-white border border-outline-variant rounded-xl font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm font-medium whitespace-nowrap">
                          Manage Subscription
                        </button>
                      </Link>
                    </div>
                  </div>
                  
                  {activePlan !== "Free" && (
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
                  )}
                </div>
              );
            })()}
          </section>
        </div>
      </div>
    </>
  );
}
