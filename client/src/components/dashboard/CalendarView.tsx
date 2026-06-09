"use client";

import React, { useState } from "react";

export function CalendarView({ isDemo = false }: { isDemo?: boolean }) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  return (
    <>
      {/* Calendar Header */}
      <div className="flex justify-between items-center px-8 py-6 border-b border-outline-variant/20 bg-background flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">October 2024</h1>
          <div className="flex items-center gap-2 bg-surface-container-low rounded-lg p-1 border border-outline-variant/20">
            <button className="p-1.5 hover:bg-white rounded hover:shadow-sm transition-all"><span className="material-symbols-outlined">chevron_left</span></button>
            <span className="font-label-md text-label-md px-2 text-on-surface-variant">Today</span>
            <button className="p-1.5 hover:bg-white rounded hover:shadow-sm transition-all"><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-surface-container-low p-1 rounded-lg flex border border-outline-variant/20">
            <button className="px-4 py-1.5 bg-white shadow-sm rounded-md font-label-md text-label-md text-primary">Month</button>
            <button className="px-4 py-1.5 rounded-md font-label-md text-label-md text-on-surface-variant hover:text-primary">Week</button>
          </div>
          <button className="bg-[#0071E3] text-white px-4 py-2 rounded-lg font-label-md text-label-md flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Post
          </button>
        </div>
      </div>

      {/* Two Column Layout: Calendar & Details Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-surface-container-low/30">
          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-4 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center font-label-md text-label-md text-on-surface-variant">{day}</div>
            ))}
          </div>
          
          {/* Calendar Cells (Simplified Month View) */}
          <div className="grid grid-cols-7 gap-4 flex-1 auto-rows-[minmax(120px,1fr)]">
            {/* Blank days for start of month */}
            <div className="min-h-[120px] rounded-xl border border-outline-variant/10 bg-surface-container-lowest/50"></div>
            <div className="min-h-[120px] rounded-xl border border-outline-variant/10 bg-surface-container-lowest/50"></div>
            
            {/* Day 1 */}
            <div className="min-h-[120px] rounded-xl border border-outline-variant/20 bg-white p-2 hover:border-[#0071E3]/30 transition-colors group">
              <div className="text-right font-label-md text-label-md text-on-surface-variant mb-2">1</div>
              <div className="bg-secondary-fixed/50 border border-secondary-fixed text-on-surface-variant text-[10px] p-1.5 rounded mb-1 truncate cursor-grab font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-secondary mr-1"></span>Draft: Q4 Strategy
              </div>
            </div>
            
            {/* Day 2 */}
            <div className="min-h-[120px] rounded-xl border border-outline-variant/20 bg-white p-2 hover:border-[#0071E3]/30 transition-colors group">
              <div className="text-right font-label-md text-label-md text-on-surface-variant mb-2">2</div>
            </div>
            
            {/* Day 3 */}
            <div className="min-h-[120px] rounded-xl border border-outline-variant/20 bg-white p-2 hover:border-[#0071E3]/30 transition-colors group">
              <div className="text-right font-label-md text-label-md text-on-surface-variant mb-2">3</div>
              <div className="bg-tertiary-fixed/50 border border-tertiary-fixed text-tertiary text-[10px] p-1.5 rounded mb-1 truncate cursor-grab font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-tertiary mr-1"></span>Scheduled: Product Update
              </div>
            </div>
            
            {/* Day 4 */}
            <div className="min-h-[120px] rounded-xl border border-outline-variant/20 bg-white p-2 hover:border-[#0071E3]/30 transition-colors group">
              <div className="text-right font-label-md text-label-md text-on-surface-variant mb-2">4</div>
            </div>
            
            {/* Day 5 */}
            <div className="min-h-[120px] rounded-xl border border-[#0071E3]/40 bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-colors relative cursor-pointer" onClick={() => setIsDetailsOpen(true)}>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#0071E3] rounded-full"></div>
              <div className="text-right font-label-md text-label-md text-[#0071E3] font-bold mb-2">5</div>
              <div className="bg-error-container/50 border border-error-container text-error text-[10px] p-1.5 rounded mb-1 truncate cursor-grab font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-error mr-1"></span>Failed: API Down
              </div>
              <div className="bg-surface-container-high border border-outline-variant/30 text-on-surface text-[10px] p-1.5 rounded mb-1 truncate cursor-grab font-medium ring-1 ring-[#0071E3]/50">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>Published: AI Insights
              </div>
            </div>
            
            {/* More generic days to fill grid */}
            {[6, 7, 8, 9].map((day) => (
              <div key={day} className="min-h-[120px] rounded-xl border border-outline-variant/20 bg-white p-2 hover:border-[#0071E3]/30 transition-colors group">
                <div className="text-right font-label-md text-label-md text-on-surface-variant mb-2">{day}</div>
              </div>
            ))}
            
            <div className="min-h-[120px] rounded-xl border border-outline-variant/20 bg-white p-2 hover:border-[#0071E3]/30 transition-colors group">
              <div className="text-right font-label-md text-label-md text-on-surface-variant mb-2">10</div>
              <div className="bg-tertiary-fixed/50 border border-tertiary-fixed text-tertiary text-[10px] p-1.5 rounded mb-1 truncate cursor-grab font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-tertiary mr-1"></span>Scheduled: Podcast Ep 12
              </div>
            </div>
            
            {[11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((day) => (
              <div key={day} className="min-h-[120px] rounded-xl border border-outline-variant/20 bg-white p-2 hover:border-[#0071E3]/30 transition-colors group">
                <div className="text-right font-label-md text-label-md text-on-surface-variant mb-2">{day}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right Panel: Post Details */}
        {isDetailsOpen && (
          <div className="w-80 bg-white border-l border-outline-variant/20 flex flex-col flex-shrink-0 animate-in slide-in-from-right-8 duration-300">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
              <h2 className="font-title-lg text-title-lg text-on-surface">Post Details</h2>
              <button onClick={() => setIsDetailsOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-emerald-50 rounded-md text-[10px] font-label-md font-bold uppercase tracking-wider text-emerald-600">Published</span>
                <span className="text-body-sm font-body-sm text-on-surface-variant text-xs">Oct 5, 2024 • 09:00 AM</span>
              </div>
              
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">AI Insights: The Future of Automation</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 leading-relaxed">
                Discover how generative AI is reshaping the landscape of modern SaaS platforms. In this week's breakdown, we explore...
              </p>
              
              <div className="rounded-xl overflow-hidden mb-6 border border-outline-variant/20">
                <img 
                  alt="AI network visualization" 
                  className="w-full h-40 object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIgco9kzrMBSbu6868zfWusgB3g6NQ-1ggeVpS112oRwCEPtoN4gGKzrlc1liBJ11de_-lloclFITDke8PxcthbOzrPvpep4KejFG0DgfWh1hX-YviznksIrxnOMdX6jWoNAP8OpEIQxyyY9NXdMkXYhHYrGI-WWDkeOHVmNsZKdC0RnfId_7VoFqX0cR_mkz9FuJL8GXhdVhqKWoK3nw4cDUnFSX0Z_qedlKwQvKWXEM45oSrTic39y7-loNsUfUMqXnsCOZ8c_s"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Platforms</span>
                  <div className="flex gap-2">
                    <span className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[12px]">𝕏</span>
                    <span className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[12px]">in</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Author</span>
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">Sarah Jenkins</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-outline-variant/10 bg-surface-container-lowest space-y-3">
              <button className="w-full py-2 bg-white border border-outline-variant/40 rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors flex justify-center items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">edit</span> Edit Post
              </button>
              <div className="flex gap-3">
                <button className="flex-1 py-2 bg-white border border-outline-variant/40 rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors">
                  Duplicate
                </button>
                <button className="flex-1 py-2 bg-white border border-outline-variant/40 rounded-lg font-label-md text-label-md text-error hover:bg-error-container/20 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
