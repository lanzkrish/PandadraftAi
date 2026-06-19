"use client";

import React, { useEffect, useState } from "react";

export function PostLibraryView() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
        const res = await fetch(`${apiUrl}/api/dashboard/posts`, { credentials: "include" });
        const data = await res.json();
        setPosts(data);
      } catch (error) {
        console.error("Failed to fetch posts", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'posted': return <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> Published</span>;
      case 'scheduled': return <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> Scheduled</span>;
      case 'failed': return <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> Failed</span>;
      default: return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">draft</span> Draft</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-surface-container-low p-6 lg:p-gutter">
      <div className="max-w-5xl mx-auto w-full pb-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Content Library</h1>
            <p className="text-on-surface-variant font-body-md mt-1">Your history of generated and scheduled posts.</p>
          </div>
          <button className="bg-primary text-white px-4 py-2 rounded-lg font-label-md text-label-md flex items-center gap-2 shadow-sm hover:opacity-90">
            <span className="material-symbols-outlined text-[18px]">add</span> New Post
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="material-symbols-outlined animate-spin text-[32px] text-primary">sync</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-[48px] text-outline-variant mb-4">description</span>
            <h3 className="font-title-lg text-title-lg text-on-surface">No posts yet</h3>
            <p className="text-on-surface-variant mt-2">Go to the Generator or Write Post tab to create your first LinkedIn post!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map(post => (
              <article key={post._id} className="bg-white p-6 rounded-xl border border-outline-variant/20 hover:shadow-md transition-shadow flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(post.status)}
                      <span className="text-body-sm text-on-surface-variant">
                        Created: {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      {post.scheduled_for && (
                        <span className="text-body-sm text-primary font-medium flex items-center gap-1">
                           <span className="material-symbols-outlined text-[14px]">event</span>
                           For: {new Date(post.scheduled_for).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <h3 className="font-title-lg text-title-lg text-on-surface line-clamp-1">{post.idea || post.topic || "Untitled Post"}</h3>
                  </div>
                </div>
                <p className="text-on-surface-variant font-body-md whitespace-pre-wrap line-clamp-3">
                  {post.post_content}
                </p>
                <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-outline-variant/10">
                  <button className="py-1.5 px-3 rounded text-primary hover:bg-surface-container-low font-label-md text-label-md transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">visibility</span> View
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
