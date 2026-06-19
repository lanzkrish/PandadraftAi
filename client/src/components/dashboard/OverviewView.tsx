"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CircularProgress } from "@/components/ui/CircularProgress";

export function OverviewView({ isDemo = false }: { isDemo?: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) return;
    const apiUrl = "" /* Proxy rewrite in next.config.ts handles backend routing */;
    fetch(`${apiUrl}/api/dashboard/overview`, { credentials: "include" })
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch overview", err);
        setLoading(false);
      });
  }, [isDemo]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center w-full h-full text-on-surface-variant font-body-lg">
        <CircularProgress value={0} size={48} className="animate-spin mr-4" />
        Loading your overview...
      </div>
    );
  }

  const name = isDemo ? "Demo User" : (data?.name || "User");
  const metrics = isDemo ? {
    scheduled: 24,
    published: 112,
    activePillars: 4,
    aiReachScore: 85
  } : (data?.metrics || { scheduled: 0, published: 0, activePillars: 0, aiReachScore: 0 });

  const upcoming = isDemo ? [
    { _id: '1', topic: "10 ways to optimize SaaS pricing", idea: "Discuss pricing models", status: "drafted", createdAt: new Date().toISOString() }
  ] : (data?.upcoming || []);

  return (
    <>
      <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-1">
            Welcome back, {name}.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Here is what is happening with your content today.
          </p>
        </div>
      </header>

      {/* Metric Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card glass hoverEffect>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container rounded-lg">
              <span className="material-symbols-outlined text-primary">schedule</span>
            </div>
            <Badge variant="default">This Week</Badge>
          </div>
          <div>
            <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-1">Posts Scheduled</h3>
            <p className="font-headline-lg text-headline-lg text-on-surface">{metrics.scheduled}</p>
          </div>
        </Card>

        <Card glass hoverEffect>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container rounded-lg">
              <span className="material-symbols-outlined text-primary">send</span>
            </div>
            <Badge variant="default">This Month</Badge>
          </div>
          <div>
            <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-1">Published Posts</h3>
            <p className="font-headline-lg text-headline-lg text-on-surface">{metrics.published}</p>
          </div>
        </Card>

        <Card glass hoverEffect>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container rounded-lg">
              <span className="material-symbols-outlined text-primary">category</span>
            </div>
            <Badge variant="glass">Active</Badge>
          </div>
          <div>
            <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-1">Content Pillars</h3>
            <p className="font-headline-lg text-headline-lg text-on-surface">{metrics.activePillars}</p>
          </div>
        </Card>

        <Card glass hoverEffect className="flex flex-col justify-between relative overflow-hidden">
          <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-2 relative z-10">AI Reach Score</h3>
          <div className="relative w-full flex-grow flex items-center justify-center">
            <CircularProgress value={metrics.aiReachScore} size={96} />
          </div>
        </Card>
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <Card glass hoverEffect={false}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-title-lg text-title-lg text-on-surface">Upcoming Scheduled</h3>
              <button className="font-label-md text-label-md text-tertiary hover:opacity-80 transition-opacity">
                View All
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {upcoming.length === 0 ? (
                <div className="p-4 text-center text-on-surface-variant font-body-sm">
                  No upcoming posts scheduled. Click New Post to get started.
                </div>
              ) : (
                upcoming.map((post: any) => (
                  <div key={post._id} className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/40 transition-colors group cursor-pointer border border-transparent hover:border-white/60">
                    <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary">edit_document</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-body-lg text-body-lg font-medium text-on-surface truncate">{post.topic}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="glass">LinkedIn</Badge>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {isDemo ? "Today, 2:00 PM" : new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-on-surface-variant hover:bg-white/60 rounded-full">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card glass className="bg-white/40 border-white/50">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-tertiary">auto_awesome</span>
                <h3 className="font-title-lg text-title-lg text-on-surface">AI Suggestions</h3>
              </div>
              <div className="flex flex-col gap-4">
                <div className="bg-white/60 rounded-lg p-4 cursor-pointer hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group border border-white/40 shadow-sm">
                  <span className="font-label-md text-label-md text-tertiary mb-2 block">Trending Topic</span>
                  <h4 className="font-body-lg text-body-lg font-medium text-on-surface mb-2 line-clamp-2">
                    How AI is changing B2B sales cycles in 2024
                  </h4>
                  <Button variant="glass" className="w-full mt-2">Generate Draft</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
