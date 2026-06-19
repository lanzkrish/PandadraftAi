"use client";

import React, { useState, useRef, useEffect } from "react";

export function PostsView({ isDemo = false }: { isDemo?: boolean }) {
  const [postContent, setPostContent] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [postId, setPostId] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const apiUrl = "" /* Proxy rewrite in next.config.ts handles backend routing */;
    fetch(`${apiUrl}/api/dashboard/settings`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(console.error);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [postContent]);

  const saveDraft = async () => {
    if (postId) return postId;
    const lines = postContent.split('\n').filter(l => l.trim() !== '');
    const title = lines[0] || 'Manual Draft';

    const apiUrl = "" /* Proxy rewrite in next.config.ts handles backend routing */;
    const res = await fetch(`${apiUrl}/api/dashboard/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, content: postContent })
    });
    const data = await res.json();
    if (data.success) {
      setPostId(data.post._id);
      return data.post._id;
    }
    throw new Error('Failed to save draft');
  };

  const handlePostNow = async () => {
    if (!postContent.trim()) return;
    try {
      setIsPosting(true);
      const id = await saveDraft();
      const apiUrl = "" /* Proxy rewrite in next.config.ts handles backend routing */;
      const res = await fetch(`${apiUrl}/api/dashboard/posts/${id}/publish`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to post");
      alert("Post published successfully!");
      setPostContent("");
      setPostId(null);
    } catch (error) {
      console.error(error);
      alert("Error publishing post");
    } finally {
      setIsPosting(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleTime || !postContent.trim()) return;
    try {
      setIsScheduling(true);
      const id = await saveDraft();
      const apiUrl = "" /* Proxy rewrite in next.config.ts handles backend routing */;
      const res = await fetch(`${apiUrl}/api/dashboard/posts/${id}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scheduledFor: new Date(scheduleTime).toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to schedule");
      setScheduledFor(scheduleTime);
      setShowScheduleModal(false);
      alert("Post scheduled successfully!");
    } catch (error) {
      console.error(error);
      alert("Error scheduling post");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start min-h-0 w-full h-full bg-[#f3f2ef] overflow-y-auto p-4 lg:p-12 pt-8 lg:pt-16">
      
      {/* LinkedIn-style Post Creation Modal */}
      <div className="w-full max-w-[744px] bg-white rounded-lg shadow-sm border border-outline-variant/20 flex flex-col mb-12 flex-shrink-0">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-4">
            {/* Optional profile image here, or generic */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/20 flex-shrink-0">
              <img 
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <h2 className="font-title-lg text-title-lg text-on-surface font-semibold leading-tight">{user?.name || "Loading..."}</h2>
              <button className="flex items-center gap-1 border border-outline-variant/40 rounded-full px-3 py-1 mt-1 hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">public</span>
                <span className="font-body-sm text-[12px] text-on-surface font-medium">Anyone</span>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">arrow_drop_down</span>
              </button>
            </div>
          </div>
          <button className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 transition-colors">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Text Area */}
        <div className="flex-1 p-6 min-h-[300px]">
          <textarea
            ref={textareaRef}
            placeholder="What do you want to talk about?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="w-full h-full min-h-[300px] bg-transparent border-none focus:ring-0 resize-none font-body-lg text-[16px] leading-relaxed text-on-surface placeholder:text-outline-variant outline-none"
          />
        </div>

        {scheduledFor && (
          <div className="px-6 py-2">
            <div className="flex items-center gap-2 bg-amber-50 text-amber-800 p-3 rounded-md font-body-sm">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              This post is scheduled for: {new Date(scheduledFor).toLocaleString()}
            </div>
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="flex justify-end items-center px-4 md:px-6 py-3 mt-auto">
          {/* Post/Schedule actions right side */}
          <div className="flex items-center gap-1 md:gap-3 flex-wrap justify-end">
            <div className="relative">
              <button 
                onClick={() => setShowScheduleModal(!showScheduleModal)}
                className={`text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors ${showScheduleModal ? 'bg-surface-container-low text-primary' : ''}`}
                title="Schedule for later"
              >
                <span className="material-symbols-outlined text-[24px]">schedule</span>
              </button>
              
              {/* Popover for Date Picker */}
              {showScheduleModal && (
                <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-outline-variant/20 p-4 z-50">
                  <h4 className="font-label-md text-label-md text-on-surface mb-2">Schedule post</h4>
                  <input 
                    type="datetime-local" 
                    className="w-full px-3 py-2 border border-outline-variant/30 rounded-md text-sm text-on-surface outline-none focus:border-primary mb-3"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setShowScheduleModal(false)}
                      className="px-3 py-1.5 text-label-md font-label-md text-on-surface-variant hover:bg-surface-container-low rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSchedule}
                      disabled={isScheduling || !scheduleTime || !postContent.trim()}
                      className="px-3 py-1.5 text-label-md font-label-md bg-primary text-white rounded-md hover:opacity-90 disabled:opacity-50 transition-colors"
                    >
                      {isScheduling ? "Scheduling..." : "Schedule"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handlePostNow}
              disabled={isPosting || !postContent.trim()}
              className="px-4 md:px-6 py-2 rounded-full font-label-md text-label-sm md:text-label-md font-semibold bg-[#0a66c2] text-white hover:bg-[#004182] disabled:bg-surface-container-highest disabled:text-outline-variant transition-colors"
            >
              {isPosting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
