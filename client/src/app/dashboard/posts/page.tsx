"use client";

import React, { useState, useEffect, useRef } from "react";

export default function PostsPage() {
  const [postTitle, setPostTitle] = useState("Excited to announce our Q3 Product Launch!");
  const [postContent, setPostContent] = useState(
    "We've been quietly building something that fundamentally changes how teams manage their design systems. 🛠️\n\nFor the past 6 months, our engineering and product teams have been heads down, rethinking the workflow from the ground up. The friction between design tokens and implementation has always been a bottleneck. Not anymore.\n\nToday, we are thrilled to unveil Autodraft 2.0. 🚀\n\nWhat's new:\n• Real-time token synchronization across Figma and codebase.\n• Automated PR generation for style updates.\n• Zero-config integration with major modern frameworks.\n\nWe believe that high-performing teams shouldn't waste time on manual translation. They should focus on crafting incredible user experiences.\n\nCheck out the full release notes in the comments below, and let us know what you think! 👇\n\n#productlaunch #designsystems #engineering #innovation"
  );
  const [showToolbar, setShowToolbar] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0 && selection.rangeCount > 0) {
        // Only show if selection is inside the editor
        if (editorRef.current?.contains(selection.anchorNode)) {
          setShowToolbar(true);
          return;
        }
      }
      setShowToolbar(false);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden w-full h-full bg-background">
      {/* Left Column: Editor & Metrics */}
      <div className="flex-1 flex flex-col lg:w-3/5 lg:border-r border-outline-variant/20 bg-white relative overflow-y-auto">
        {/* Editor Header */}
        <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center bg-white sticky top-0 z-30">
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-label-md font-label-md bg-surface-container-low text-on-surface-variant rounded-md hover:bg-surface-container-high transition-colors">
              Save Draft
            </button>
            <button className="px-3 py-1.5 text-label-md font-label-md text-tertiary hover:bg-tertiary/10 rounded-md transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">history</span> History
            </button>
          </div>
          <div className="flex items-center gap-2 text-label-md font-label-md text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Auto-saved
          </div>
        </div>

        {/* Rich Text Editor Canvas */}
        <div className="flex-grow p-8 lg:p-12">
          <div className="max-w-2xl mx-auto relative">
            <input 
              className="w-full bg-transparent border-none font-headline-lg text-headline-lg text-on-surface placeholder:text-outline-variant focus:ring-0 mb-6 p-0 outline-none" 
              placeholder="Post Title (Internal)" 
              type="text" 
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
            />
            {/* Faux Content Editable Area */}
            <div 
              ref={editorRef}
              className="outline-none min-h-[300px] text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-wrap" 
              contentEditable={true}
              onInput={(e) => setPostContent(e.currentTarget.textContent || "")}
              suppressContentEditableWarning={true}
            >
              {postContent}
            </div>

            {/* Floating Formatting Toolbar */}
            <div 
              className={`absolute top-[40%] left-1/2 transform -translate-x-1/2 bg-surface-container-highest shadow-lg rounded-lg border border-outline-variant/20 px-2 py-1 flex items-center gap-1 transition-opacity duration-200 z-40 ${showToolbar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
              <button className="p-1.5 text-on-surface-variant hover:bg-surface hover:text-primary rounded-md"><span className="material-symbols-outlined text-[20px]">format_bold</span></button>
              <button className="p-1.5 text-on-surface-variant hover:bg-surface hover:text-primary rounded-md"><span className="material-symbols-outlined text-[20px]">format_italic</span></button>
              <div className="w-px h-4 bg-outline-variant/50 mx-1"></div>
              <button className="p-1.5 text-tertiary hover:bg-tertiary/10 rounded-md"><span className="material-symbols-outlined text-[20px]">auto_awesome</span></button>
            </div>
          </div>
        </div>

        {/* AI Optimization Dashboard (Below Editor) */}
        <div className="border-t border-outline-variant/20 bg-surface-container-lowest p-8 mt-auto">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">analytics</span> AI Optimization
              </h3>
              {/* Prominent Score */}
              <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/30">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Overall Reach Score</span>
                <span className="font-headline-lg text-[24px] text-tertiary leading-none">88<span className="text-[16px] text-outline-variant">/100</span></span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Metric 1 */}
              <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-md text-label-md text-on-surface-variant">Hook Strength</span>
                  <span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
                </div>
                <div className="font-title-lg text-title-lg text-on-surface mb-1">Strong</div>
                <div className="w-full bg-surface-container-high rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: '85%'}}></div>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-md text-label-md text-on-surface-variant">Readability</span>
                  <span className="material-symbols-outlined text-[16px] text-amber-500">warning</span>
                </div>
                <div className="font-title-lg text-title-lg text-on-surface mb-1">Fair</div>
                <div className="w-full bg-surface-container-high rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{width: '60%'}}></div>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-md text-label-md text-on-surface-variant">Authenticity</span>
                  <span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
                </div>
                <div className="font-title-lg text-title-lg text-on-surface mb-1">High</div>
                <div className="w-full bg-surface-container-high rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: '92%'}}></div>
                </div>
              </div>
            </div>

            {/* Suggestions Cards */}
            <div className="space-y-3">
              <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Suggestions</h4>
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 flex gap-4 items-start group hover:-translate-y-px transition-transform duration-200 cursor-pointer">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">format_align_left</span>
                </div>
                <div className="flex-grow">
                  <p className="font-body-sm text-body-sm text-on-surface font-medium mb-1">Break up paragraph 2</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Shorter paragraphs perform 24% better on mobile feeds. Consider splitting "For the past 6 months..." into two lines.</p>
                </div>
                <button className="text-tertiary font-label-md text-label-md bg-tertiary/5 px-3 py-1.5 rounded-md hover:bg-tertiary/10 transition-colors opacity-0 group-hover:opacity-100">Fix</button>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 flex gap-4 items-start group hover:-translate-y-px transition-transform duration-200 cursor-pointer">
                <div className="p-2 bg-tertiary/10 rounded-lg text-tertiary mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">tag</span>
                </div>
                <div className="flex-grow">
                  <p className="font-body-sm text-body-sm text-on-surface font-medium mb-1">Optimize Hashtags</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Adding #SaaS could increase reach to relevant product managers by ~12% based on current trending topics.</p>
                </div>
                <button className="text-tertiary font-label-md text-label-md bg-tertiary/5 px-3 py-1.5 rounded-md hover:bg-tertiary/10 transition-colors opacity-0 group-hover:opacity-100">Apply</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Live Preview */}
      <div className="lg:w-2/5 bg-surface-container-low p-8 flex flex-col items-center border-t lg:border-t-0 border-outline-variant/20 overflow-y-auto">
        {/* Preview Controls */}
        <div className="w-full max-w-sm mb-6 flex justify-between items-center">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Live Preview</span>
          <div className="flex bg-surface-container-high rounded-lg p-1 border border-outline-variant/20">
            <button className="px-3 py-1 rounded-md bg-white shadow-sm text-primary transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">smartphone</span>
            </button>
            <button className="px-3 py-1 rounded-md text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">desktop_mac</span>
            </button>
          </div>
        </div>

        {/* Mobile Device Mockup */}
        <div className="w-full max-w-[340px] bg-white rounded-[2rem] shadow-xl border-[8px] border-surface-container-high overflow-hidden relative flex-grow max-h-[700px] flex flex-col">
          {/* Status Bar Mock */}
          <div className="h-6 w-full bg-white flex justify-between items-center px-4 text-[10px] text-on-surface-variant font-medium">
            <span>9:41</span>
            <div className="flex gap-1">
              <span className="material-symbols-outlined text-[12px]">signal_cellular_4_bar</span>
              <span className="material-symbols-outlined text-[12px]">wifi</span>
              <span className="material-symbols-outlined text-[12px]">battery_full</span>
            </div>
          </div>

          {/* LinkedIn App Header Mock */}
          <div className="flex items-center px-4 py-2 border-b border-outline-variant/20 gap-3 bg-white">
            <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden">
              <img alt="User profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAttsjLqNN_pEsO907Y_NF9tAn6bhOlKIY0BeEHF9ZOlWNR3m9PyLiXurmbzYikS17npbQzi1ZNWVhuPzJtI0yJJKkmGYdO7dI7a8fUHasZEUAVQU82V7cSLzYPzx71l5PouesGQ-37H2uhODBmhVXAlkiVPJniUXKROtQ6r1N3pr_HlfFA-qQSha70_fsHNEhq8tI5JTUflYIQf0S4G6zAeSUqETFOAtOYYH3T56_Kn07_gO1EWU2I-dpB2N4LhHZp-tCsw9nnEO8" />
            </div>
            <div className="flex-grow bg-surface-container-low rounded-md h-8 flex items-center px-3">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">search</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chat</span>
          </div>

          {/* Post Preview Content */}
          <div className="p-4 flex-grow overflow-y-auto bg-surface-container-low/30">
            <div className="bg-white rounded-lg border border-outline-variant/20 p-4 shadow-sm">
              {/* Post Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant/20">
                  <img alt="User profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFSMuWBljgrdB1xBS3XC_9dJz1q-R8bU4jqO-PXqt--sR_67tafq3SYqsZlR5_Xwa-eRsdaRR7d9AX3sAPbT9j-uwgFdwJyMTRtE_N5ejCVf8fKef7lTBFDytR0S_fB8BH57PUseLh7jaMwGizt7lsh81gH5Dom4nNVRu0NuA9popS9Aa3WMY2GpTsJufDJ7OYh5NrbNzxPRm2VjSeeM5l87uMgAaNC0Z6L4GAqbJBJIAk3q0M2gw1AGYjyKUyT82GbtrDl8HAcBc" />
                </div>
                <div>
                  <h4 className="font-title-lg text-[14px] leading-tight text-on-surface font-semibold">Alex Rivera</h4>
                  <p className="font-body-sm text-[12px] text-on-surface-variant leading-tight">Head of Product @ Autodraft</p>
                  <p className="font-body-sm text-[10px] text-outline-variant mt-0.5 flex items-center gap-1">Just now • <span className="material-symbols-outlined text-[10px]">public</span></p>
                </div>
              </div>

              {/* Post Body (Synced with Editor) */}
              <div className="font-body-sm text-[13px] text-on-surface leading-relaxed mb-3 whitespace-pre-wrap">
                {postContent.length > 250 ? postContent.substring(0, 250) + "..." : postContent}
                {postContent.length > 250 && <span className="text-tertiary cursor-pointer hover:underline ml-1">see more</span>}
              </div>

              {/* Image Attachment Mock */}
              <div className="w-full h-40 bg-surface-container-low rounded-md border border-outline-variant/20 mb-3 overflow-hidden flex items-center justify-center">
                <img alt="A sleek, modern dashboard interface" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuACt7AUsbymb4mobTqHtFclH7IHWE9RIr4ox2b_L_hLYqiCE5Bmh3dTM6fM93KBExvNz2yNZiJDYxwcKt5s1MWqozfS4bPLEi0gXpyEt4S2OaU8pU2YKwY-IMQQSoqanXDLHnJTSu70gcuyLdT9jvfg6ON5KCU0q2ecYeh060iW5S0tEBRmsK6ndG2y-IQ8gAK4KG1hwDdulvow-vLUe5QzobSHQDKK8p6JrPD84WOnQ4eyFR5HX8UOauDueI6_YVVw0lj-21_eodQ" />
              </div>

              {/* Post Actions Mock */}
              <div className="flex justify-between items-center pt-2 border-t border-outline-variant/10 text-on-surface-variant px-2">
                <div className="flex items-center gap-1 cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                  <span className="font-body-sm text-[12px]">Like</span>
                </div>
                <div className="flex items-center gap-1 cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                  <span className="font-body-sm text-[12px]">Comment</span>
                </div>
                <div className="flex items-center gap-1 cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                  <span className="font-body-sm text-[12px]">Repost</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Nav Mock */}
          <div className="flex justify-around items-center px-4 py-3 border-t border-outline-variant/20 bg-white text-on-surface-variant">
            <div className="flex flex-col items-center text-on-surface"><span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>home</span></div>
            <div className="flex flex-col items-center"><span className="material-symbols-outlined text-[20px]">group</span></div>
            <div className="flex flex-col items-center"><span className="material-symbols-outlined text-[20px]">add_box</span></div>
            <div className="flex flex-col items-center"><span className="material-symbols-outlined text-[20px]">notifications</span></div>
            <div className="flex flex-col items-center"><span className="material-symbols-outlined text-[20px]">work</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
