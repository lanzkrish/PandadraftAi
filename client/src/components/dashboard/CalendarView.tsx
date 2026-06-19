"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export function CalendarView({ isDemo = false }: { isDemo?: boolean }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  
  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
        const res = await fetch(`${apiUrl}/api/dashboard/posts`, { credentials: "include" });
        const data = await res.json();
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          setPosts([]);
          console.error("Failed to fetch posts, received:", data);
        }
      } catch (error) {
        console.error("Failed to fetch posts", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    let day = new Date(year, month, 1).getDay();
    // Adjust so Monday is 0
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getPostsForDay = (day: number) => {
    return posts.filter(post => {
      const dateString = post.scheduled_for || post.createdAt;
      const d = new Date(dateString);
      return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-emerald-500 border-emerald-600 text-emerald-900 bg-opacity-20';
      case 'scheduled': return 'bg-amber-500 border-amber-600 text-amber-900 bg-opacity-20';
      case 'failed': return 'bg-red-500 border-red-600 text-red-900 bg-opacity-20';
      default: return 'bg-gray-200 border-gray-300 text-gray-700 bg-opacity-50';
    }
  };

  return (
    <>
      <div className="flex justify-between items-center px-8 py-6 border-b border-outline-variant/20 bg-background flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{monthNames[currentMonth]} {currentYear}</h1>
          <div className="flex items-center gap-2 bg-surface-container-low rounded-lg p-1 border border-outline-variant/20">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded hover:shadow-sm transition-all"><span className="material-symbols-outlined">chevron_left</span></button>
            <span className="font-label-md text-label-md px-2 text-on-surface-variant">Today</span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded hover:shadow-sm transition-all"><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/write" className="bg-[#0071E3] text-white px-4 py-2 rounded-lg font-label-md text-label-md flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Post
          </Link>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-surface-container-low/30">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center font-label-md text-label-md text-on-surface-variant">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-4 flex-1 auto-rows-[minmax(120px,1fr)]">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[120px] rounded-xl border border-outline-variant/10 bg-surface-container-lowest/50"></div>
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayPosts = getPostsForDay(day);
              const isToday = day === currentDate.getDate() && currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear();
              
              return (
                <div key={day} className={`min-h-[120px] rounded-xl border p-2 transition-colors group ${isToday ? 'border-[#0071E3]/40 bg-white shadow-sm' : 'border-outline-variant/20 bg-white hover:border-[#0071E3]/30'}`}>
                  <div className={`text-right font-label-md text-label-md mb-2 ${isToday ? 'text-[#0071E3] font-bold' : 'text-on-surface-variant'}`}>{day}</div>
                  
                  <div className="space-y-1">
                    {dayPosts.map(post => (
                      <div 
                        key={post._id} 
                        onClick={() => setSelectedPost(post)}
                        className={`border text-[10px] p-1.5 rounded truncate cursor-pointer font-medium ${getStatusColor(post.status)}`}
                      >
                        {post.status === 'scheduled' ? 'Scheduled: ' : post.status === 'posted' ? 'Published: ' : 'Draft: '}
                        {post.idea || post.topic}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {selectedPost && (
          <div className="w-80 bg-white border-l border-outline-variant/20 flex flex-col flex-shrink-0 animate-in slide-in-from-right-8 duration-300">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
              <h2 className="font-title-lg text-title-lg text-on-surface">Post Details</h2>
              <button onClick={() => setSelectedPost(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-1 rounded-md text-[10px] font-label-md font-bold uppercase tracking-wider ${getStatusColor(selectedPost.status)}`}>
                  {selectedPost.status}
                </span>
                <span className="text-body-sm font-body-sm text-on-surface-variant text-xs">
                  {new Date(selectedPost.scheduled_for || selectedPost.createdAt).toLocaleString()}
                </span>
              </div>
              
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-4">{selectedPost.idea || selectedPost.topic}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 leading-relaxed whitespace-pre-wrap">
                {selectedPost.post_content}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
