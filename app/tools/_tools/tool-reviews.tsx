"use client";

// =============================================================================
// isaacpaha.com — Reusable Tool Reviews Component
// components/tools/tool-reviews.tsx
//
// Drop this on any tool page. Fetches live DB reviews, shows the aggregate
// rating header, and lets signed-in users submit or update their own review.
//
// Usage:
//   <ToolReviews
//     toolId={tool.id}
//     toolName={tool.name}
//     accentColor={tool.accentColor}
//     isSignedIn={isSignedIn}
//   />
// =============================================================================

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence }                  from "framer-motion";
import {
  Star, Loader2, AlertCircle, Check, MessageSquare,
  ThumbsUp, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewUser {
  id:          string;
  displayName: string;
  firstName:   string | null;
  lastName:    string | null;
  avatarUrl:   string | null;
}

interface Review {
  id:        string;
  rating:    number;
  comment:   string | null;
  createdAt: string;
  user:      ReviewUser;
}

interface ReviewsResponse {
  reviews:     Review[];
  total:       number;
  pages:       number;
  ratingAvg:   number;
  ratingCount: number;
}

interface Props {
  toolId:       string;
  toolName:     string;
  accentColor?: string;
  isSignedIn:   boolean;
}

// ─── Star display ─────────────────────────────────────────────────────────────

function StarDisplay({
  rating,
  size = "sm",
  interactive = false,
  onRate,
}: {
  rating:       number;
  size?:        "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?:      (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const dim = size === "lg" ? "w-7 h-7" : size === "md" ? "w-5 h-5" : "w-3.5 h-3.5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = s <= (interactive ? (hovered || rating) : rating);
        return (
          <button
            key={s}
            type={interactive ? "button" : undefined}
            onClick={interactive && onRate ? () => onRate(s) : undefined}
            onMouseEnter={interactive ? () => setHovered(s) : undefined}
            onMouseLeave={interactive ? () => setHovered(0) : undefined}
            className={interactive ? "transition-transform hover:scale-110" : ""}
            disabled={!interactive}
          >
            <Star
              className={`${dim} transition-colors ${
                filled ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-100"
              } ${interactive ? "cursor-pointer" : ""}`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ─── Rating bar ───────────────────────────────────────────────────────────────

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-stone-400 w-3 text-right">{star}</span>
      <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-amber-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: star * 0.05 }}
        />
      </div>
      <span className="text-[11px] text-stone-400 w-4">{count}</span>
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const name = review.user.displayName ||
    [review.user.firstName, review.user.lastName].filter(Boolean).join(" ") ||
    "Anonymous";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const ago = (() => {
    const d = Math.floor((Date.now() - new Date(review.createdAt).getTime()) / 86400000);
    if (d < 1)  return "today";
    if (d === 1) return "yesterday";
    if (d < 7)  return `${d} days ago`;
    if (d < 30) return `${Math.floor(d / 7)} week${Math.floor(d / 7) > 1 ? "s" : ""} ago`;
    if (d < 365)return `${Math.floor(d / 30)} month${Math.floor(d / 30) > 1 ? "s" : ""} ago`;
    return `${Math.floor(d / 365)} year${Math.floor(d / 365) > 1 ? "s" : ""} ago`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {review.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={review.user.avatarUrl}
              alt={name}
              className="w-9 h-9 rounded-full object-cover border border-gray-100"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-600">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{name}</p>
          </div>
        </div>
        <div className="text-right">
          <StarDisplay rating={review.rating} size="sm" />
          <p className="text-xs text-gray-400 mt-1">{ago}</p>
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
      )}
    </motion.div>
  );
}

// ─── Submit form ──────────────────────────────────────────────────────────────

function ReviewForm({
  toolId,
  accentColor = "#f59e0b",
  existingRating = 0,
  existingComment = "",
  onSubmitted,
}: {
  toolId:           string;
  accentColor?:     string;
  existingRating?:  number;
  existingComment?: string;
  onSubmitted:      (review: Review) => void;
}) {
  const [rating,    setRating]    = useState(existingRating);
  const [comment,   setComment]   = useState(existingComment);
  const [submitting,setSubmitting]= useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);

  const handleSubmit = async () => {
    if (!rating) { setError("Please select a star rating."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`/api/tools/${toolId}/reviews`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Submission failed."); return; }
      setDone(true);
      onSubmitted(data.review);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xs px-4 py-3.5">
        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <p className="text-sm font-semibold text-emerald-800">
          {existingRating ? "Review updated — thanks!" : "Review submitted — thank you!"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xs p-5">
      <p className="text-xs font-black text-stone-500 uppercase tracking-wider mb-3">
        {existingRating ? "Update your review" : "Leave a review"}
      </p>

      {/* Star picker */}
      <div className="flex items-center gap-3 mb-3">
        <StarDisplay rating={rating} size="lg" interactive onRate={setRating} />
        {rating > 0 && (
          <span className="text-sm font-semibold text-stone-600">
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Share your experience (optional)…"
        className="w-full text-sm border border-stone-200 rounded-xs px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-none bg-white mb-1"
      />
      <p className="text-[10px] text-stone-400 mb-3 text-right">{comment.length}/500</p>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xs mb-3">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || !rating}
        className="flex items-center justify-center gap-2 text-sm font-bold text-white py-2.5 px-5 rounded-xs transition-colors disabled:opacity-50 w-full"
        style={{ backgroundColor: accentColor }}
      >
        {submitting
          ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</>
          : <><ThumbsUp className="w-4 h-4" />{existingRating ? "Update Review" : "Submit Review"}</>
        }
      </button>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function ToolReviews({ toolId, toolName, accentColor = "#f59e0b", isSignedIn }: Props) {
  const [data,        setData]        = useState<ReviewsResponse | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [myReview,    setMyReview]    = useState<Review | null>(null);
  const [distribution, setDistribution] = useState<Record<number, number>>({});

  const fetchReviews = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/tools/${toolId}/reviews?page=${p}&pageSize=10`);
      const json = await res.json() as ReviewsResponse;
      setData(json);
      setPage(p);

      // Build star distribution from loaded reviews (approximate)
      const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      json.reviews.forEach((r) => { dist[r.rating] = (dist[r.rating] ?? 0) + 1; });
      setDistribution(dist);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [toolId]);

  useEffect(() => { fetchReviews(1); }, [fetchReviews]);

  const handleNewReview = (review: Review) => {
    setMyReview(review);
    fetchReviews(1); // refresh list
  };

  const avg   = data?.ratingAvg   ?? 0;
  const count = data?.ratingCount ?? 0;

  return (
    <div className="space-y-6" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* ── Aggregate header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-black text-gray-900">Reviews</h2>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <StarDisplay rating={Math.round(avg)} size="sm" />
            <span className="text-sm font-bold text-gray-700">{avg.toFixed(1)}</span>
            <span className="text-sm text-gray-400">({count.toLocaleString()})</span>
          </div>
        )}
      </div>

      {/* Rating breakdown */}
      {count > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-stone-50 border border-stone-100 rounded-xs p-5">
          {/* Big number */}
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-6xl font-black text-stone-900">{avg.toFixed(1)}</span>
            <StarDisplay rating={Math.round(avg)} size="md" />
            <span className="text-xs text-stone-400">{count.toLocaleString()} review{count !== 1 ? "s" : ""}</span>
          </div>
          {/* Bars */}
          <div className="space-y-1.5 justify-center flex flex-col">
            {[5, 4, 3, 2, 1].map((s) => (
              <RatingBar key={s} star={s} count={distribution[s] ?? 0} total={count} />
            ))}
          </div>
        </div>
      )}

      {/* ── Submit form ──────────────────────────────────────────────────── */}
      {isSignedIn ? (
        <ReviewForm
          toolId={toolId}
          accentColor={accentColor}
          existingRating={myReview?.rating}
          existingComment={myReview?.comment ?? ""}
          onSubmitted={handleNewReview}
        />
      ) : (
        <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xs px-5 py-4">
          <MessageSquare className="w-4 h-4 text-stone-400 flex-shrink-0" />
          <p className="text-sm text-stone-500">
            <a href={`/sign-in?redirect_url=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/tools")}`}
              className="font-semibold text-stone-800 underline underline-offset-2 hover:text-amber-600 transition-colors">
              Sign in
            </a>{" "}
            to leave a review for {toolName}.
          </p>
        </div>
      )}

      {/* ── Reviews list ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-stone-300 animate-spin" />
        </div>
      ) : data && data.reviews.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {data.reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </AnimatePresence>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchReviews(page - 1)}
                className="text-xs font-semibold text-stone-500 border border-stone-200 px-4 py-2 rounded-xs hover:border-amber-400 disabled:opacity-40 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-xs text-stone-400">Page {page} of {data.pages}</span>
              <button
                disabled={page >= data.pages}
                onClick={() => fetchReviews(page + 1)}
                className="text-xs font-semibold text-stone-500 border border-stone-200 px-4 py-2 rounded-xs hover:border-amber-400 disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-stone-200 rounded-xs">
          <MessageSquare className="w-8 h-8 text-stone-200 mb-3" />
          <p className="text-sm font-bold text-stone-400 mb-1">No reviews yet</p>
          <p className="text-xs text-stone-300">Be the first to leave a review for {toolName}.</p>
        </div>
      )}
    </div>
  );
}