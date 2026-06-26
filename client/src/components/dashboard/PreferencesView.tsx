"use client";

import React, { useEffect, useState } from "react";
import { CircularProgress } from "@/components/ui/CircularProgress";

export function PreferencesView({ isDemo = false }: { isDemo?: boolean }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(!isDemo);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isDemo) return;
    const apiUrl = "" /* Proxy rewrite in next.config.ts handles backend routing */;
    
    fetch(`${apiUrl}/api/dashboard/settings`, { credentials: "include" })
      .then(res => res.json())
      .then(json => {
        setUser(json);
        setLoading(false);
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
      const apiUrl = "" /* Proxy rewrite in next.config.ts handles backend routing */;
      const res = await fetch(`${apiUrl}/api/dashboard/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(user)
      });
      if (res.ok) {
        // success
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
        Loading preferences...
      </div>
    );
  }

  const displayUser = isDemo ? {} : (user || {});

  return (
    <>
      <header className="mb-10 flex justify-between items-end border-b border-outline-variant/30 pb-6">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 tracking-tight">Content Preferences</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Set up your Content Categories/Pillars and voice settings.</p>
        </div>
      </header>

      <div className="max-w-3xl">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-outline-variant/50 shadow-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface-variant ml-1">Content Categories / Pillars</label>
              <p className="font-body-sm text-[13px] text-on-surface-variant mb-2 ml-1">What topics do you want the AI to write about? Separate multiple topics with commas.</p>
              <input 
                name="content_categories"
                className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all" 
                type="text" 
                placeholder="E.g. Engineering Leadership, Startups, Web Development"
                value={displayUser.content_categories || ""}
                onChange={handleChange}
                disabled={isDemo}
              />
            </div>

            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface-variant ml-1">Content Tone</label>
              <p className="font-body-sm text-[13px] text-on-surface-variant mb-2 ml-1">Choose the default tone of voice for your generated posts.</p>
              <select 
                className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all appearance-none cursor-pointer" 
                value={displayUser.content_tone || "professional"}
                onChange={(e) => {
                  if (!isDemo) setUser({ ...user, content_tone: e.target.value });
                }}
                disabled={isDemo}
              >
                <option value="professional">Professional & Approachable</option>
                <option value="casual">Casual & Friendly</option>
                <option value="thought-leadership">Bold & Visionary (Thought Leadership)</option>
                <option value="storytelling">Narrative & Storytelling</option>
              </select>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={isDemo || isSaving}
              className="px-6 py-3 bg-[#0071E3] text-white rounded-xl font-label-md text-label-md hover:opacity-90 transition-opacity shadow-sm font-medium disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
