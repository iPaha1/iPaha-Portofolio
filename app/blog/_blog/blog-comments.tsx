"use client";

// =============================================================================
// isaacpaha.com — Comments Section
// app/blog/_blog/blog-comments.tsx
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Check, CornerDownRight, ThumbsUp, Loader2 } from "lucide-react";
import type { DBComment } from "@/lib/types/blog";

// Derive initials + a deterministic avatar colour from a name
const AVATAR_COLORS = ["#f59e0b", "#10b981", "#8b5cf6", "#3b82f6", "#ec4899", "#14b8a6"];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(d: string | Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Single Comment ──────────────────────────────────────────────────────────

interface CommentItemProps {
  comment:    DBComment;
  postSlug:   string;
  depth?:     number;
  onReply:    (id: string, name: string) => void;
}

const CommentItem = ({ comment, postSlug, depth = 0, onReply }: CommentItemProps) => {
  const [liked,     setLiked]     = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [liking,    setLiking]    = useState(false);

  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    const action = liked ? "unlike" : "like";
    // Optimistic update
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      await fetch(`/api/blog/${postSlug}/comments/${comment.id}/like`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      });
    } catch {
      // Revert on failure
      setLiked(liked);
      setLikeCount((c) => c + (liked ? 1 : -1));
    }
    setLiking(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 ${depth > 0 ? "ml-10" : ""}`}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5"
        style={{ backgroundColor: getAvatarColor(comment.authorName) }}
      >
        {comment.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comment.avatarUrl} alt={comment.authorName} className="w-full h-full rounded-full object-cover" />
        ) : (
          getInitials(comment.authorName)
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-white border border-gray-100 rounded-xs p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900">{comment.authorName}</p>
              {comment.isEdited && (
                <span className="text-[10px] text-gray-400">(edited)</span>
              )}
            </div>
            <span className="text-xs text-gray-400 shrink-0">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-2 px-1">
          <button
            onClick={toggleLike}
            disabled={liking}
            className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
              liked ? "text-amber-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${liked ? "fill-amber-500" : ""}`} />
            {likeCount > 0 ? likeCount : ""}
          </button>
          {depth === 0 && (
            <button
              onClick={() => onReply(comment.id, comment.authorName)}
              className="text-xs text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-1"
            >
              <CornerDownRight className="w-3 h-3" /> Reply
            </button>
          )}
        </div>

        {/* Replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={{ ...reply, replies: [] }}
                postSlug={postSlug}
                depth={depth + 1}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main Section ─────────────────────────────────────────────────────────────

interface CommentsProps {
  postId:   string;
  postSlug: string;
  count:    number;
}

export const CommentsSection = ({ postSlug, count }: CommentsProps) => {
  const [comments,    setComments]    = useState<DBComment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [body,        setBody]        = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [error,       setError]       = useState("");
  const [replyingTo,  setReplyingTo]  = useState<{ id: string; name: string } | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res  = await fetch(`/api/blog/${postSlug}/comments`);
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, [postSlug]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !body.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/blog/${postSlug}/comments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          authorName:  name.trim(),
          authorEmail: email.trim(),
          content:     body.trim(),
          parentId:    replyingTo?.id ?? null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to submit comment.");
        setSubmitting(false);
        return;
      }

      setName("");
      setEmail("");
      setBody("");
      setReplyingTo(null);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  // Total: DB count + any new approved ones (none until moderated, but keep UI consistent)
  const displayCount = count;

  return (
    <div className="mt-16 pt-12 border-t border-gray-100">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="w-5 h-5 text-amber-500" />
        <h2 className="text-2xl font-black text-gray-900">Discussion</h2>
        <span className="text-sm font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-xs">
          {displayCount} {displayCount === 1 ? "comment" : "comments"}
        </span>
      </div>

      {/* Comment form */}
      <div className="bg-gray-50 border border-gray-200 rounded-xs p-5 mb-8">
        {replyingTo && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xs mb-4">
            <CornerDownRight className="w-3.5 h-3.5" />
            Replying to <span className="font-bold">{replyingTo.name}</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-auto text-amber-500 hover:text-amber-700 font-semibold"
            >
              Cancel
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="thanks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 px-4 py-4 rounded-xs"
            >
              <Check className="w-5 h-5" />
              <div>
                <p className="text-sm font-semibold">Comment submitted!</p>
                <p className="text-xs mt-0.5 text-green-600">
                  It will appear after moderation. Thanks for joining the discussion.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 mb-3">Share your thoughts</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-white border border-gray-200 rounded-xs px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 transition-all"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (not published)"
                  className="w-full bg-white border border-gray-200 rounded-xs px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 transition-all"
                />
              </div>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 500))}
                placeholder="What do you think? Agree, disagree, or extend the argument…"
                rows={4}
                className="w-full bg-white border border-gray-200 rounded-xs px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 transition-all resize-none"
              />

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xs">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{body.length}/500</p>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !name.trim() || !email.trim() || !body.trim()}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xs transition-all"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Post comment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Comments list */}
      <div className="space-y-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No comments yet — be the first.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postSlug={postSlug}
              onReply={(id, name) => setReplyingTo({ id, name })}
            />
          ))
        )}
      </div>
    </div>
  );
};








// "use client";

// import React, { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { MessageSquare, Check, CornerDownRight, ThumbsUp } from "lucide-react";

// interface Comment {
//   id: string;
//   name: string;
//   initials: string;
//   avatarColor: string;
//   body: string;
//   date: string;
//   likes: number;
//   isReply?: boolean;
// }

// const INITIAL_COMMENTS: Comment[] = [
//   {
//     id: "1",
//     name: "Kwame Asante",
//     initials: "KA",
//     avatarColor: "#f59e0b",
//     body: "This is exactly the framing I needed. The leapfrog argument isn't new, but the specific connection to M-Pesa and what comes next is compelling. What sector do you think produces the first $100B African company?",
//     date: "2 days ago",
//     likes: 24,
//   },
//   {
//     id: "2",
//     name: "Priya Nair",
//     initials: "PN",
//     avatarColor: "#8b5cf6",
//     body: "The risk section is what most optimistic takes on African tech skip entirely. The value extraction problem is real and worth a full essay of its own.",
//     date: "3 days ago",
//     likes: 18,
//   },
//   {
//     id: "3",
//     name: "Thomas Webb",
//     initials: "TW",
//     avatarColor: "#10b981",
//     body: "Really well argued. I'd push back slightly on the median age statistic though — demographic dividend requires the right education and infrastructure investments to materialise. What's your take on the skills gap?",
//     date: "5 days ago",
//     likes: 12,
//     isReply: false,
//   },
// ];

// const AVATAR_COLORS = ["#f59e0b", "#10b981", "#8b5cf6", "#3b82f6", "#ec4899", "#14b8a6"];

// export const CommentsSection = ({
//   count,
// }: {
//   postId: string;
//   count: number;
// }) => {
//   const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
//   const [name, setName] = useState("");
//   const [body, setBody] = useState("");
//   const [submitted, setSubmitted] = useState(false);
//   const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
//   const [replyingTo, setReplyingTo] = useState<string | null>(null);

//   const totalCount = count + comments.length - INITIAL_COMMENTS.length;

//   const handleSubmit = () => {
//     if (!name.trim() || !body.trim()) return;
//     const initials = name
//       .split(" ")
//       .map((w) => w[0])
//       .slice(0, 2)
//       .join("")
//       .toUpperCase();
//     const newComment: Comment = {
//       id: Date.now().toString(),
//       name,
//       initials,
//       avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
//       body,
//       date: "just now",
//       likes: 0,
//       isReply: !!replyingTo,
//     };
//     setComments((prev) => [...prev, newComment]);
//     setName("");
//     setBody("");
//     setReplyingTo(null);
//     setSubmitted(true);
//     setTimeout(() => setSubmitted(false), 4000);
//   };

//   const toggleLike = (id: string) => {
//     setLikedIds((prev) => {
//       const next = new Set(prev);
//       if (next.has(id)) next.delete(id);
//       else next.add(id);
//       return next;
//     });
//     setComments((prev) =>
//       prev.map((c) =>
//         c.id === id
//           ? { ...c, likes: c.likes + (likedIds.has(id) ? -1 : 1) }
//           : c
//       )
//     );
//   };

//   return (
//     <div className="mt-16 pt-12 border-t border-gray-100">
//       <div className="flex items-center gap-3 mb-8">
//         <MessageSquare className="w-5 h-5 text-amber-500" />
//         <h2 className="text-2xl font-black text-gray-900">
//           Discussion
//         </h2>
//         <span className="text-sm font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-xs">
//           {totalCount} comments
//         </span>
//       </div>

//       {/* Comment form */}
//       <div className="bg-gray-50 border border-gray-200 rounded-xs p-5 mb-8">
//         {replyingTo && (
//           <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xs mb-4">
//             <CornerDownRight className="w-3.5 h-3.5" />
//             Replying to comment
//             <button
//               onClick={() => setReplyingTo(null)}
//               className="ml-auto text-amber-500 hover:text-amber-700 font-semibold"
//             >
//               Cancel
//             </button>
//           </div>
//         )}

//         <AnimatePresence mode="wait">
//           {submitted ? (
//             <motion.div
//               key="thanks"
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0 }}
//               className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 px-4 py-4 rounded-xs"
//             >
//               <Check className="w-5 h-5" />
//               <div>
//                 <p className="text-sm font-semibold">Comment submitted!</p>
//                 <p className="text-xs mt-0.5 text-green-600">
//                   Thank you for joining the discussion.
//                 </p>
//               </div>
//             </motion.div>
//           ) : (
//             <motion.div
//               key="form"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               className="space-y-3"
//             >
//               <p className="text-sm font-semibold text-gray-700 mb-3">
//                 Share your thoughts
//               </p>
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 placeholder="Your name"
//                 className="w-full bg-white border border-gray-200 rounded-xs px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 transition-all"
//               />
//               <textarea
//                 value={body}
//                 onChange={(e) => setBody(e.target.value)}
//                 placeholder="What do you think? Agree, disagree, or extend the argument…"
//                 rows={4}
//                 className="w-full bg-white border border-gray-200 rounded-xs px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 transition-all resize-none"
//               />
//               <div className="flex items-center justify-between">
//                 <p className="text-xs text-gray-400">
//                   {body.length}/500 characters
//                 </p>
//                 <button
//                   onClick={handleSubmit}
//                   disabled={!name.trim() || !body.trim()}
//                   className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xs transition-all"
//                 >
//                   Post comment
//                 </button>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* Comments list */}
//       <div className="space-y-5">
//         {comments.map((comment) => (
//           <motion.div
//             key={comment.id}
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             className={`flex gap-4 ${comment.isReply ? "ml-10" : ""}`}
//           >
//             {/* Avatar */}
//             <div
//               className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5"
//               style={{ backgroundColor: comment.avatarColor }}
//             >
//               {comment.initials}
//             </div>

//             <div className="flex-1 min-w-0">
//               <div className="bg-white border border-gray-100 rounded-xs p-4">
//                 <div className="flex items-center justify-between gap-2 mb-2">
//                   <p className="text-sm font-bold text-gray-900">{comment.name}</p>
//                   <span className="text-xs text-gray-400 shrink-0">{comment.date}</span>
//                 </div>
//                 <p className="text-sm text-gray-700 leading-relaxed">{comment.body}</p>
//               </div>

//               {/* Comment actions */}
//               <div className="flex items-center gap-3 mt-2 px-1">
//                 <button
//                   onClick={() => toggleLike(comment.id)}
//                   className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
//                     likedIds.has(comment.id) ? "text-amber-600" : "text-gray-400 hover:text-gray-600"
//                   }`}
//                 >
//                   <ThumbsUp className={`w-3.5 h-3.5 ${likedIds.has(comment.id) ? "fill-amber-500" : ""}`} />
//                   {comment.likes + (likedIds.has(comment.id) ? 1 : 0)}
//                 </button>
//                 <button
//                   onClick={() => setReplyingTo(comment.id)}
//                   className="text-xs text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-1"
//                 >
//                   <CornerDownRight className="w-3 h-3" /> Reply
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         ))}
//       </div>
//     </div>
//   );
// };