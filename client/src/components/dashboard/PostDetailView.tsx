"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function PostDetailView({ postId }: { postId: string }) {
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [postContent, setPostContent] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const apiUrl = "" /* Proxy rewrite handles backend routing */;
    // Fetch settings/user
    fetch(`${apiUrl}/api/dashboard/settings`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(console.error);
      
    // Fetch post details
    const fetchPost = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/dashboard/posts/${postId}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setPost(data);
          setPostContent(data.post_content || "");
          if (data.scheduled_for) {
            // Format to YYYY-MM-DDThh:mm for datetime-local input
            const date = new Date(data.scheduled_for);
            const formatted = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            setScheduleTime(formatted);
          }
        } else {
          console.error("Failed to fetch post");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [postId]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [postContent]);

  const handleSave = async () => {
    if (!postContent.trim()) return;
    try {
      setIsSaving(true);
      const apiUrl = "" /* Proxy rewrite */;
      const res = await fetch(`${apiUrl}/api/dashboard/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: postContent })
      });
      if (!res.ok) throw new Error("Failed to save changes");
      const data = await res.json();
      setPost(data.post);
      alert("Changes saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Error saving changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePostNow = async () => {
    if (!postContent.trim()) return;
    try {
      setIsPosting(true);
      const apiUrl = "" /* Proxy rewrite */;
      const res = await fetch(`${apiUrl}/api/dashboard/posts/${postId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: postContent }) // Send latest content
      });
      if (!res.ok) throw new Error("Failed to publish");
      const data = await res.json();
      setPost(data.post);
      alert("Post published successfully!");
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
      const apiUrl = "" /* Proxy rewrite */;
      const res = await fetch(`${apiUrl}/api/dashboard/posts/${postId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          scheduledFor: new Date(scheduleTime).toISOString(),
          content: postContent
        }),
      });
      if (!res.ok) throw new Error("Failed to schedule");
      const data = await res.json();
      setPost(data.post);
      setShowScheduleModal(false);
      alert("Post scheduled successfully!");
    } catch (error) {
      console.error(error);
      alert("Error scheduling post");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelSchedule = async () => {
    try {
      setIsCanceling(true);
      const apiUrl = "" /* Proxy rewrite */;
      const res = await fetch(`${apiUrl}/api/dashboard/posts/${postId}/cancel-schedule`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to cancel schedule");
      const data = await res.json();
      setPost(data.post);
      alert("Schedule canceled. Post reverted to draft.");
    } catch (error) {
      console.error(error);
      alert("Error canceling schedule");
    } finally {
      setIsCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full bg-surface-container-low">
        <span className="material-symbols-outlined animate-spin text-[32px] text-primary">sync</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-surface-container-low p-6">
        <h2 className="text-title-lg font-title-lg mb-4 text-on-surface">Post not found</h2>
        <Link href="/dashboard/posts" className="text-primary hover:underline font-medium">
          Back to Library
        </Link>
      </div>
    );
  }

  const isPosted = post.status === 'posted';
  const isScheduled = post.status === 'scheduled';

  return (
    <div className="flex-1 flex flex-col items-center justify-start min-h-0 w-full h-full bg-[#f3f2ef] overflow-y-auto p-4 lg:p-12 pt-8 lg:pt-16">
      <div className="w-full max-w-[744px] mb-4 flex justify-between items-center">
        <Link href="/dashboard/posts" className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors font-medium">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Back to Library
        </Link>
        {isPosted && post.linkedin_post_id && (
          <a 
            href={`https://www.linkedin.com/feed/update/${post.linkedin_post_id}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#0a66c2] text-white px-4 py-1.5 rounded-full font-label-md text-label-md hover:bg-[#004182] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            View on LinkedIn
          </a>
        )}
      </div>

      {/* LinkedIn-style Post Creation Modal */}
      <div className="w-full max-w-[744px] bg-white rounded-lg shadow-sm border border-outline-variant/20 flex flex-col mb-12 flex-shrink-0">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/20 flex-shrink-0">
              <img 
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <h2 className="font-title-lg text-title-lg text-on-surface font-semibold leading-tight">{user?.name || "Loading..."}</h2>
              <div className="flex items-center gap-2 mt-1">
                <button className="flex items-center gap-1 border border-outline-variant/40 rounded-full px-3 py-1 hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">public</span>
                  <span className="font-body-sm text-[12px] text-on-surface font-medium">Anyone</span>
                </button>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isPosted ? 'bg-emerald-50 text-emerald-600' :
                  isScheduled ? 'bg-amber-50 text-amber-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {post.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 p-6 min-h-[300px]">
          <textarea
            ref={textareaRef}
            placeholder="What do you want to talk about?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            readOnly={isPosted}
            className={`w-full h-full min-h-[300px] bg-transparent border-none focus:ring-0 resize-none font-body-lg text-[16px] leading-relaxed text-on-surface placeholder:text-outline-variant outline-none ${isPosted ? 'opacity-80' : ''}`}
          />
        </div>

        {isScheduled && post.scheduled_for && (
          <div className="px-6 py-2">
            <div className="flex items-center justify-between bg-amber-50 text-amber-800 p-3 rounded-md font-body-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                This post is scheduled for: {new Date(post.scheduled_for).toLocaleString()}
              </div>
              <button 
                onClick={handleCancelSchedule}
                disabled={isCanceling}
                className="text-red-600 hover:text-red-700 font-label-md flex items-center gap-1 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                {isCanceling ? "Canceling..." : "Cancel Schedule"}
              </button>
            </div>
          </div>
        )}

        {isPosted && (
          <div className="px-6 py-2">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-3 rounded-md font-body-sm">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              This post was published on: {new Date(post.updatedAt || post.createdAt).toLocaleString()}
            </div>
          </div>
        )}

        {/* Bottom Actions Row */}
        {!isPosted && (
          <div className="flex justify-end items-center px-6 py-3 mt-auto border-t border-outline-variant/10">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving || postContent === post.post_content}
                className="px-4 py-2 rounded-full font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50 transition-colors"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>

              <div className="relative">
                <button 
                  onClick={() => setShowScheduleModal(!showScheduleModal)}
                  className={`text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors ${showScheduleModal ? 'bg-surface-container-low text-primary' : ''}`}
                  title={isScheduled ? "Reschedule" : "Schedule for later"}
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
                        {isScheduling ? "Scheduling..." : isScheduled ? "Reschedule" : "Schedule"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handlePostNow}
                disabled={isPosting || !postContent.trim()}
                className="px-6 py-2 rounded-full font-label-md text-label-md font-semibold bg-[#0a66c2] text-white hover:bg-[#004182] disabled:bg-surface-container-highest disabled:text-outline-variant transition-colors"
              >
                {isPosting ? "Posting..." : "Post Now"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
