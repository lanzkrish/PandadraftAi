"use client";

import React, { useState } from "react";

export function GeneratorView({ isDemo = false }: { isDemo?: boolean }) {
  const [audiences, setAudiences] = useState<string[]>(["SaaS Founders"]);
  const [newAudience, setNewAudience] = useState("");
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("Drive Engagement");
  const [tone, setTone] = useState("Professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{hook: string, description: string, postContent: string} | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [postStatus, setPostStatus] = useState<"drafted"|"scheduled"|"posted"|"failed">("drafted");
  const [scheduledDate, setScheduledDate] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");

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

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }
    setError("");
    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
      const res = await fetch(`${apiUrl}/api/dashboard/generate/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          topic,
          goal,
          audiences,
          tone
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate content");
      setGeneratedResult(data.variation);
      setHistoryId(data.historyId);
      setPostStatus("drafted");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostNow = async () => {
    if (!historyId) return;
    setIsPublishing(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
      const res = await fetch(`${apiUrl}/api/dashboard/posts/${historyId}/publish`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");
      setPostStatus("posted");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (!historyId || !scheduledDate) return;
    setIsPublishing(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
      const res = await fetch(`${apiUrl}/api/dashboard/posts/${historyId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scheduledFor: new Date(scheduledDate).toISOString() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule");
      setPostStatus("scheduled");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPublishing(false);
    }
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
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Input Group: Goal */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Primary Goal</label>
            <div className="relative focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 border border-outline-variant/20 rounded-lg bg-white overflow-hidden transition-all duration-200">
              <select 
                className="w-full bg-transparent border-none py-3 pl-3 pr-10 appearance-none font-body-sm text-body-sm focus:ring-0 outline-none"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
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
              {['Professional', 'Conversational', 'Authoritative', 'Witty'].map(t => (
                <button 
                  key={t}
                  onClick={() => setTone(t)}
                  className={`py-2 px-3 border rounded-lg font-label-md text-label-md text-center transition-colors ${
                    tone === t 
                      ? 'border-[#0071E3] bg-[#0071E3]/5 text-[#0071E3]' 
                      : 'border-outline-variant/20 bg-white text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-outline-variant/20">
          {error && <p className="text-error text-sm mb-4 font-body-sm">{error}</p>}
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-4 bg-[#0071E3] text-white rounded-lg font-label-md text-label-md font-bold uppercase tracking-wider shadow-[0_4px_14px_0_rgba(0,113,227,0.39)] hover:shadow-[0_6px_20px_rgba(0,113,227,0.23)] hover:-translate-y-0.5 transition-all duration-200 flex justify-center items-center gap-2 ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <span className="material-symbols-outlined">{isGenerating ? 'hourglass_empty' : 'auto_awesome'}</span>
            {isGenerating ? 'Generating...' : 'Generate Content'}
          </button>
        </div>
      </aside>

      {/* Right Area (Output Canvas) */}
      <section className="flex-1 bg-surface-container-low overflow-y-auto p-6 md:p-gutter relative">
        <div className="max-w-[800px] mx-auto pb-24">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-headline-lg text-headline-lg text-on-surface">Generated Content</h3>
            <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full font-label-md text-label-md uppercase">
              {generatedResult ? "1 Result Ready" : "0 Results"}
            </span>
          </div>

          <div className="space-y-6">
            {generatedResult ? (
              <article className="bg-white border border-outline-variant/20 p-6 rounded-xl flex flex-col gap-4 transition-all duration-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-[2px]">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{generatedResult.hook}</span>
                  <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[14px] text-[#0071E3]">vital_signs</span>
                    <span className="font-label-md text-label-md text-on-surface">92 Reach Score</span>
                  </div>
                </div>

                <div className="space-y-4 font-body-lg text-body-lg text-on-surface">
                  <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                    {generatedResult.postContent}
                  </p>
                </div>

                <div className="flex flex-wrap justify-end items-center gap-3 mt-4 pt-4 border-t border-outline-variant/20">
                  {postStatus === 'posted' ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1"><span className="material-symbols-outlined">check_circle</span> Published</span>
                  ) : postStatus === 'scheduled' ? (
                    <span className="text-amber-500 font-bold flex items-center gap-1"><span className="material-symbols-outlined">schedule</span> Scheduled for {new Date(scheduledDate).toLocaleString()}</span>
                  ) : (
                    <>
                      <button className="py-2 px-4 rounded-lg bg-white border border-outline-variant/20 text-primary font-label-md text-label-md hover:bg-surface-container-low transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <input 
                          type="datetime-local" 
                          className="border border-outline-variant/30 rounded-md p-1.5 font-body-sm text-on-surface"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                        />
                        <button 
                          onClick={handleSchedule}
                          disabled={!scheduledDate || isPublishing}
                          className={`py-2 px-4 rounded-lg bg-primary text-white font-label-md text-label-md hover:opacity-90 transition-all flex items-center gap-2 ${(!scheduledDate || isPublishing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">schedule</span> {isPublishing ? '...' : 'Schedule'}
                        </button>
                      </div>

                      <button 
                        onClick={handlePostNow}
                        disabled={isPublishing}
                        className={`py-2 px-4 rounded-lg bg-[#0071E3] text-white font-label-md text-label-md hover:opacity-90 transition-all flex items-center gap-2 ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">send</span> {isPublishing ? '...' : 'Post Now'}
                      </button>
                    </>
                  )}
                </div>
              </article>
            ) : (
              <div className="text-center py-12 text-on-surface-variant">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined animate-spin text-[32px] text-primary">sync</span>
                    <p>Generating your viral post...</p>
                  </div>
                ) : (
                  "Fill out the workspace setup and click generate to see your post here."
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
