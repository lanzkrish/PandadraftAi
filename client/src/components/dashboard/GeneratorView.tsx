"use client";

import React, { useState } from "react";

export function GeneratorView({ isDemo = false }: { isDemo?: boolean }) {
  const [audiences, setAudiences] = useState(["SaaS Founders"]);
  const [newAudience, setNewAudience] = useState("");

  const handleAddAudience = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newAudience.trim() !== "") {
      e.preventDefault();
      setAudiences([...audiences, newAudience.trim()]);
      setNewAudience("");
    }
  };

  const removeAudience = (indexToRemove: number) => {
    setAudiences(audiences.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      {/* Left Panel (Input) */}
      <aside className="w-full md:w-1/3 max-w-[400px] bg-white border-r border-outline-variant/20 p-6 md:p-gutter flex flex-col h-full overflow-y-auto shrink-0 z-10 relative">
        <div className="mb-8">
          <h3 className="font-title-lg text-title-lg mb-2">Workspace Setup</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Configure your parameters to generate high-performing content.</p>
        </div>

        <div className="space-y-6 flex-1">
          {/* Input Group: Topic */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Topic / Subject</label>
            <div className="focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 bg-surface-container-low rounded-lg border border-outline-variant/20 p-3 transition-all duration-200">
              <textarea 
                className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-sm text-body-sm resize-none outline-none" 
                placeholder="E.g., The impact of AI on modern UI design workflows..." 
                rows={3}
              ></textarea>
            </div>
          </div>

          {/* Input Group: Goal */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Primary Goal</label>
            <div className="relative focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 border border-outline-variant/20 rounded-lg bg-white overflow-hidden transition-all duration-200">
              <select className="w-full bg-transparent border-none py-3 pl-3 pr-10 appearance-none font-body-sm text-body-sm focus:ring-0 outline-none">
                <option>Drive Engagement</option>
                <option>Lead Generation</option>
                <option>Brand Awareness</option>
                <option>Educational / Thought Leadership</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          {/* Input Group: Audience */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Target Audience</label>
            <div className="focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 bg-white rounded-lg border border-outline-variant/20 p-2 flex flex-wrap gap-2 transition-all duration-200">
              {audiences.map((audience, idx) => (
                <span key={idx} className="bg-surface-container-low text-on-surface-variant px-3 py-1 rounded-full font-label-md text-label-md flex items-center gap-1">
                  {audience} 
                  <button onClick={() => removeAudience(idx)} className="hover:text-primary">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              ))}
              <input 
                className="flex-1 min-w-[100px] bg-transparent border-none p-1 focus:ring-0 font-body-sm text-body-sm outline-none" 
                placeholder="Add audience..." 
                type="text"
                value={newAudience}
                onChange={(e) => setNewAudience(e.target.value)}
                onKeyDown={handleAddAudience}
              />
            </div>
          </div>

          {/* Input Group: Tone */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Voice & Tone</label>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-2 px-3 border border-[#0071E3] bg-[#0071E3]/5 text-[#0071E3] rounded-lg font-label-md text-label-md text-center transition-colors">Professional</button>
              <button className="py-2 px-3 border border-outline-variant/20 bg-white text-on-surface-variant hover:bg-surface-container-low rounded-lg font-label-md text-label-md text-center transition-colors">Conversational</button>
              <button className="py-2 px-3 border border-outline-variant/20 bg-white text-on-surface-variant hover:bg-surface-container-low rounded-lg font-label-md text-label-md text-center transition-colors">Authoritative</button>
              <button className="py-2 px-3 border border-outline-variant/20 bg-white text-on-surface-variant hover:bg-surface-container-low rounded-lg font-label-md text-label-md text-center transition-colors">Witty</button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-outline-variant/20">
          <button className="w-full py-4 bg-[#0071E3] text-white rounded-lg font-label-md text-label-md font-bold uppercase tracking-wider shadow-[0_4px_14px_0_rgba(0,113,227,0.39)] hover:shadow-[0_6px_20px_rgba(0,113,227,0.23)] hover:-translate-y-0.5 transition-all duration-200 flex justify-center items-center gap-2">
            <span className="material-symbols-outlined">auto_awesome</span>
            Generate Content
          </button>
        </div>
      </aside>

      {/* Right Area (Output Canvas) */}
      <section className="flex-1 bg-surface-container-low overflow-y-auto p-6 md:p-gutter relative">
        <div className="max-w-[800px] mx-auto pb-24">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-headline-lg text-headline-lg text-on-surface">Generated Variations</h3>
            <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full font-label-md text-label-md uppercase">3 Results Ready</span>
          </div>

          <div className="space-y-6">
            {/* Variation Card 1 */}
            <article className="bg-white border border-outline-variant/20 p-6 rounded-xl flex flex-col gap-4 transition-all duration-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-[2px]">
              <div className="flex justify-between items-start mb-2">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Variation A • The Provocateur</span>
                <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[14px] text-[#0071E3]">vital_signs</span>
                  <span className="font-label-md text-label-md text-on-surface">92 Reach Score</span>
                </div>
              </div>

              <div className="space-y-4 font-body-lg text-body-lg text-on-surface">
                <p className="font-bold">Stop designing buttons. Start designing systems.</p>
                <p className="text-on-surface-variant leading-relaxed">
                  The era of artisanal pixel-pushing is over. AI isn't here to replace designers; it's here to replace the tedious execution layer that bogs us down. By integrating AI into your workflow, you elevate from a builder to an architect.
                </p>
                <p className="font-medium text-[#0071E3]">👇 Read our latest teardown on how top teams are adapting.</p>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-outline-variant/20">
                <button className="p-2 text-on-surface-variant hover:text-primary transition-colors" title="Regenerate">
                  <span className="material-symbols-outlined">refresh</span>
                </button>
                <button className="py-2 px-4 rounded-lg bg-white border border-outline-variant/20 text-primary font-label-md text-label-md hover:bg-surface-container-low transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                </button>
                <button className="py-2 px-4 rounded-lg bg-primary text-white font-label-md text-label-md hover:opacity-90 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">schedule</span> Schedule
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
