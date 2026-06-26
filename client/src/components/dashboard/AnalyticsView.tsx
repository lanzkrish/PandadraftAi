"use client";

import React, { useEffect, useState } from "react";
import { CircularProgress } from "@/components/ui/CircularProgress";

export function AnalyticsView({ isDemo = false }: { isDemo?: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) return;
    const apiUrl = "" /* Proxy rewrite in next.config.ts handles backend routing */;
    fetch(`${apiUrl}/api/dashboard/analytics`, { credentials: "include" })
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch analytics", err);
        setLoading(false);
      });
  }, [isDemo]);

  const hours = ['8am', '12pm', '4pm', '8pm'];
  
  // Default demo / fallback data
  const heatmapData = data?.heatmapData || [
    [10, 20, 15, 30, 40, 5, 10], // 8am
    [20, 50, 80, 60, 40, 15, 20], // 12pm
    [30, 60, 90, 70, 50, 20, 30], // 4pm
    [15, 30, 40, 20, 10, 5,  5]  // 8pm
  ];

  const topTopics = data?.topTopics || [
    { topic: "Design Systems", engagement: 1420, rate: "8.4%" },
    { topic: "AI Integration", engagement: 980, rate: "6.2%" },
    { topic: "Minimalism", engagement: 750, rate: "4.1%" },
    { topic: "SaaS Growth", engagement: 420, rate: "2.8%" },
  ];

  const chartData = data?.chartData || [
    { date: 'Oct 1', likes: 100, comments: 20 },
    { date: 'Oct 8', likes: 120, comments: 30 },
    { date: 'Oct 15', likes: 80, comments: 15 },
    { date: 'Oct 22', likes: 150, comments: 40 },
    { date: 'Oct 29', likes: 250, comments: 60 },
  ];

  const maxValRaw = Math.max(...chartData.map((d: any) => Math.max(d.likes, d.comments)), 10);
  let maxVal = Math.ceil(maxValRaw / 10) * 10;
  if (maxVal > 100) maxVal = Math.ceil(maxValRaw / 100) * 100;
  if (maxVal > 1000) maxVal = Math.ceil(maxValRaw / 1000) * 1000;
  
  const yLabels = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];
  const formatY = (v: number) => v >= 1000 ? (v/1000).toFixed(v%1000===0?0:1)+'k' : Math.round(v).toString();
  
  const getPath = (key: string) => {
    return chartData.map((d: any, i: number) => {
      const x = i * 250;
      const y = 300 - (d[key] / maxVal) * 300;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  };
  
  const likesPath = getPath('likes');
  const commentsPath = getPath('comments');
  const gradientPath = `${likesPath} L1000,300 L0,300 Z`;

  const maxHeat = Math.max(...heatmapData.flat(), 1);

  const getColor = (value: number) => {
    if (value === 0) return 'bg-surface-container-high';
    const ratio = value / maxHeat;
    if (ratio > 0.66) return 'bg-[#005cbb]';
    if (ratio > 0.33) return 'bg-[#005cbb]/70';
    return 'bg-[#005cbb]/40';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center w-full h-full text-on-surface-variant font-body-lg">
        <CircularProgress value={0} size={48} className="animate-spin mr-4" />
        Loading your analytics...
      </div>
    );
  }

  return (
    <>
      <style>{`
        .chart-line { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawLine 2s ease-out forwards; }
        @keyframes drawLine { to { stroke-dashoffset: 0; } }
        .heatmap-cell { transition: transform 0.2s ease, opacity 0.2s ease; cursor: pointer; }
        .heatmap-cell:hover { transform: scale(1.1); z-index: 10; border: 1px solid #c4c7c8; }
      `}</style>

      {/* Page Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Performance Analytics</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Measure and analyze your content's impact across all channels.</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-white border border-outline-variant/30 rounded-md py-1.5 px-3 text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>This Quarter</option>
            <option>Year to Date</option>
          </select>
          <button className="bg-white border border-outline-variant/30 rounded-md p-1.5 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[20px]">download</span>
          </button>
        </div>
      </header>

      {/* Hero Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Metric 1 */}
        <div className="glass-card bg-white/90 backdrop-blur-md rounded-xl p-6 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300 border border-outline-variant/20 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Engagement</h3>
            <span className="material-symbols-outlined text-outline-variant">forum</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-md text-display-md text-on-surface">{data?.totalEngagement ?? "2.4k"}</span>
            <span className="font-label-md text-label-md text-[#005cbb] flex items-center bg-[#005cbb]/10 px-1.5 py-0.5 rounded-sm">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 12.5%
            </span>
          </div>
          {/* Minimal Sparkline Background */}
          <svg className="absolute bottom-0 left-0 w-full h-12 opacity-20" preserveAspectRatio="none" viewBox="0 0 100 30">
            <path d="M0,30 L0,20 L20,15 L40,25 L60,10 L80,18 L100,5 L100,30 Z" fill="#005cbb"></path>
          </svg>
        </div>

        {/* Metric 2 */}
        <div className="glass-card bg-white/90 backdrop-blur-md rounded-xl p-6 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300 border border-outline-variant/20 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Avg. Engagement</h3>
            <span className="material-symbols-outlined text-outline-variant">favorite</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-md text-display-md text-on-surface">{data?.avgEngagement ?? "4.8"}</span>
            <span className="font-label-md text-label-md text-[#005cbb] flex items-center bg-[#005cbb]/10 px-1.5 py-0.5 rounded-sm">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 2.1%
            </span>
          </div>
          <svg className="absolute bottom-0 left-0 w-full h-12 opacity-20" preserveAspectRatio="none" viewBox="0 0 100 30">
            <path d="M0,30 L0,25 L20,28 L40,15 L60,20 L80,8 L100,2 L100,30 Z" fill="#005cbb"></path>
          </svg>
        </div>

        {/* Metric 3 */}
        <div className="glass-card bg-white/90 backdrop-blur-md rounded-xl p-6 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300 border border-outline-variant/20 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Comments</h3>
            <span className="material-symbols-outlined text-outline-variant">chat_bubble_outline</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-md text-display-md text-on-surface">{data?.totalComments ?? "0"}</span>
            <span className="font-label-md text-label-md text-on-surface-variant flex items-center bg-surface-container-high px-1.5 py-0.5 rounded-sm">
              <span className="material-symbols-outlined text-[14px]">horizontal_rule</span> 0.0%
            </span>
          </div>
          <svg className="absolute bottom-0 left-0 w-full h-12 opacity-10" preserveAspectRatio="none" viewBox="0 0 100 30">
            <path d="M0,30 L0,20 L20,22 L40,20 L60,18 L80,20 L100,19 L100,30 Z" fill="#5d5f5f"></path>
          </svg>
        </div>
      </section>

      {/* Main Chart Area */}
      <section className="glass-card bg-white/90 backdrop-blur-md rounded-xl p-6 mb-8 border border-outline-variant/20 shadow-[0_12px_40px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-title-lg text-title-lg text-on-surface">Engagement Trends</h3>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="w-3 h-3 rounded-full bg-[#005cbb] group-hover:scale-110 transition-transform"></div>
              <span className="font-label-md text-label-md text-on-surface-variant">Likes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="w-3 h-3 rounded-full bg-surface-tint group-hover:scale-110 transition-transform"></div>
              <span className="font-label-md text-label-md text-on-surface-variant">Comments</span>
            </label>
          </div>
        </div>

        {/* SVG Line Chart (Stripe Inspired) */}
        <div className="w-full h-[300px] relative">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="w-full border-t border-outline-variant/10"></div>
            <div className="w-full border-t border-outline-variant/10"></div>
            <div className="w-full border-t border-outline-variant/10"></div>
            <div className="w-full border-t border-outline-variant/10"></div>
            <div className="w-full border-t border-outline-variant/10"></div>
          </div>

          {/* X-Axis Labels */}
          <div className="absolute bottom-[-24px] w-full flex justify-between font-label-md text-label-md text-outline-variant">
            {chartData.map((d: any, i: number) => <span key={i}>{d.date}</span>)}
          </div>

          {/* Y-Axis Labels */}
          <div className="absolute left-[-40px] h-full flex flex-col justify-between font-label-md text-label-md text-outline-variant text-right w-8">
            {yLabels.map((v, i) => <span key={i}>{formatY(v)}</span>)}
          </div>

          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 300">
            {/* Tertiary Line (Likes) */}
            <path className="chart-line" d={likesPath} fill="none" stroke="#005cbb" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            {/* Secondary Line (Comments) */}
            <path className="chart-line" d={commentsPath} fill="none" stroke="#5d5f5f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" style={{ animationDelay: '0.2s' }}></path>
            {/* Gradient Fill under Tertiary Line */}
            <path d={gradientPath} fill="url(#chartGradient)" opacity="0.1"></path>
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#005cbb"></stop>
                <stop offset="100%" stopColor="transparent"></stop>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      {/* Bottom Data Grid & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {/* Best Performing Topics */}
        <section className="glass-card bg-white/90 backdrop-blur-md rounded-xl p-6 border border-outline-variant/20 shadow-sm">
          <h3 className="font-title-lg text-title-lg text-on-surface mb-6">Top Topics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="font-label-md text-label-md text-on-surface-variant py-3 px-2 uppercase tracking-wider font-medium">Topic</th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-3 px-2 uppercase tracking-wider font-medium text-right">Engagement</th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-3 px-2 uppercase tracking-wider font-medium text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {topTopics.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-on-surface-variant font-body-sm">
                      No posts published yet.
                    </td>
                  </tr>
                ) : (
                  topTopics.map((topic: any, i: number) => {
                    const colors = ['bg-[#005cbb]', 'bg-surface-tint', 'bg-outline-variant', 'bg-outline-variant'];
                    return (
                      <tr key={i} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                        <td className="py-3 px-2 text-on-surface font-medium flex items-center gap-2 truncate max-w-[200px]">
                          <div className={`w-2 h-2 flex-shrink-0 rounded-full ${colors[i] || colors[0]}`}></div> 
                          {topic.topic}
                        </td>
                        <td className="py-3 px-2 text-on-surface-variant text-right">{topic.engagement}</td>
                        <td className="py-3 px-2 text-[#005cbb] text-right font-medium">{topic.rate}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Best Posting Times Heatmap */}
        <section className="glass-card bg-white/90 backdrop-blur-md rounded-xl p-6 border border-outline-variant/20 shadow-sm">
          <h3 className="font-title-lg text-title-lg text-on-surface mb-6">Posting Heatmap</h3>
          <div className="flex flex-col gap-1">
            {/* Heatmap Header (Days) */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="col-span-1"></div>
              <div className="font-label-md text-label-md text-on-surface-variant text-center">Mon</div>
              <div className="font-label-md text-label-md text-on-surface-variant text-center">Tue</div>
              <div className="font-label-md text-label-md text-on-surface-variant text-center">Wed</div>
              <div className="font-label-md text-label-md text-on-surface-variant text-center">Thu</div>
              <div className="font-label-md text-label-md text-on-surface-variant text-center">Fri</div>
              <div className="font-label-md text-label-md text-on-surface-variant text-center">Sat</div>
              <div className="font-label-md text-label-md text-on-surface-variant text-center">Sun</div>
            </div>

            {/* Rows (Hours) */}
            {hours.map((hour, rowIndex) => (
              <div key={hour} className="grid grid-cols-8 gap-1 items-center">
                <div className="font-label-md text-label-md text-on-surface-variant text-right pr-2">{hour}</div>
                {heatmapData[rowIndex].map((val, colIndex) => (
                  <div 
                    key={colIndex} 
                    className={`heatmap-cell h-8 rounded-sm ${getColor(val)}`} 
                    title={`${val} posts`}
                  ></div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex justify-end items-center gap-2 mt-4">
            <span className="font-label-md text-label-md text-outline-variant">Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-surface-container-high"></div>
              <div className="w-3 h-3 rounded-sm bg-[#005cbb]/40"></div>
              <div className="w-3 h-3 rounded-sm bg-[#005cbb]/70"></div>
              <div className="w-3 h-3 rounded-sm bg-[#005cbb]"></div>
            </div>
            <span className="font-label-md text-label-md text-outline-variant">More</span>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="w-full pt-8 pb-4 flex flex-col md:flex-row justify-between items-center border-t border-outline-variant/10 text-on-surface-variant">
        <div className="font-display-md text-[20px] text-primary mb-4 md:mb-0 font-bold">
          Pandadraft
        </div>
        <div className="font-body-sm text-body-sm text-center md:text-left mb-4 md:mb-0">
          © 2026 Pandadraft AI. All rights reserved.
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <a className="font-body-sm text-body-sm hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
          <a className="font-body-sm text-body-sm hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Terms of Service</a>
          <a className="font-body-sm text-body-sm hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Help Center</a>
          <a className="font-body-sm text-body-sm hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">API Docs</a>
        </div>
      </footer>
    </>
  );
}
