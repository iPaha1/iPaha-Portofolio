"use client";

import { useState } from "react";
import { 
  Film, Search, Filter, Eye, ThumbsUp, Star, Clock, Edit3, 
  Youtube, MoreHorizontal, TrendingUp, Loader2, Trash2, Check 
} from "lucide-react";
import { useVideos } from "@/hooks/youtube-studio/use-youtube";
import YoutubeVideoDetail from "./youtube-studio-video-detail";


const STATUSES = ["All","Draft","Ready","Filming","Editing","Scheduled","Published","Archived"];

const STATUS_COLORS: Record<string, string> = {
  Published:  "bg-green-500/15 text-green-400",
  Ready:      "bg-blue-500/15 text-blue-400",
  Scheduled:  "bg-purple-500/15 text-purple-400",
  Filming:    "bg-yellow-500/15 text-yellow-400",
  Editing:    "bg-orange-500/15 text-orange-400",
  Draft:      "bg-white/5 text-white/30",
  Archived:   "bg-white/5 text-white/20",
};

export default function YoutubeVideoLibrary({ userId }: { userId: string }) {
  const [search, setSearch] = useState("");
  const [activeStatus, setStatus] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "views" | "score">("date");
  
  const { videos, total, loading, error, refetch, toggleStar, archiveVideo } = useVideos(userId);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [starringId, setStarringId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

   // Add debugging
  // console.log("[YoutubeVideoLibrary] State:", { 
  //   videosCount: videos.length, 
  //   total, 
  //   loading, 
  //   error,
  //   sampleVideo: videos[0] 
  // });

  if (selectedVideoId) {
  return (
    <YoutubeVideoDetail
      userId={userId}
      videoId={selectedVideoId}
      onBack={() => setSelectedVideoId(null)}
    />
  );
}

  // Filter and sort videos
  const filtered = videos
    .filter(v => {
      const matchSearch = v.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = activeStatus === "All" || v.status === activeStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "views") return (b.viewCount || 0) - (a.viewCount || 0);
      if (sortBy === "score") {
        // You'll need to add a score field to your schema or calculate it
        // For now, let's use likes as a proxy or just return 0
        return (b.likeCount || 0) - (a.likeCount || 0);
      }
      // Sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleToggleStar = async (videoId: string) => {
    setStarringId(videoId);
    await toggleStar(videoId);
    setStarringId(null);
  };

  const handleArchive = async (videoId: string) => {
    setArchivingId(videoId);
    await archiveVideo(videoId);
    setArchivingId(null);
  };

  // Calculate stats from real data
  const publishedVideos = videos.filter(v => v.status === "PUBLISHED");
  const totalViews = videos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
  const avgScore = 85; // You'll need to calculate this from actual scores if you add that field

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
        <p className="text-sm text-red-400">Error loading videos: {error}</p>
        <button 
          onClick={refetch}
          className="mt-2 px-3 py-1 rounded-lg bg-white/5 text-xs text-white/70 hover:bg-white/10"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-lg px-3 py-2 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="bg-transparent text-sm text-white/70 placeholder:text-white/25 outline-none flex-1"
          />
        </div>
        
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                ${activeStatus === s 
                  ? "bg-red-500/20 text-red-300 border border-red-500/20" 
                  : "bg-white/3 text-white/40 hover:text-white/70 border border-transparent"}`}
            >
              {s}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-white/30">Sort:</span>
          {(["date","views","score"] as const).map(s => (
            <button 
              key={s} 
              onClick={() => setSortBy(s)} 
              className={`text-xs px-2.5 py-1.5 rounded-lg capitalize transition-all 
                ${sortBy === s ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-white/30">
        {filtered.length} video{filtered.length !== 1 ? "s" : ""}
        {filtered.length !== videos.length && ` (${videos.length} total)`}
      </p>

      {/* Table */}
      <div className="rounded-xl bg-white/3 border border-white/5 overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_80px_100px_100px_80px_60px] gap-4 px-5 py-3 border-b border-white/5 text-xs font-semibold text-white/30 uppercase tracking-wider">
          <span>Video</span>
          <span>Created</span>
          <span>Status</span>
          <span>Views</span>
          <span>Likes</span>
          <span>Duration</span>
          <span />
        </div>


          
        <div className="divide-y divide-white/3">

{filtered.map(video => {
  const tags = video.coreConcepts 
    ? (typeof video.coreConcepts === 'string' ? JSON.parse(video.coreConcepts) : video.coreConcepts)
    : [];
  
  return (
    <div 
      key={video.id} 
      onClick={() => setSelectedVideoId(video.id)}
      className="grid md:grid-cols-[2fr_1fr_80px_100px_100px_80px_60px] gap-4 items-center px-5 py-4 hover:bg-white/2 transition-colors cursor-pointer"
    >
      {/* Content goes directly inside this div, not another nested div */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center shrink-0">
          <Film className="w-3.5 h-3.5 text-red-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{video.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {tags.slice(0, 2).map((t: string) => (
              <span key={t} className="text-[9px] text-white/25">{t}</span>
            ))}
          </div>
        </div>
      </div>
      
      <span className="text-xs text-white/40">
        {new Date(video.createdAt).toLocaleDateString()}
      </span>
      
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${STATUS_COLORS[video.status] || STATUS_COLORS.Draft}`}>
        {video.status.toLowerCase()}
      </span>
      
      <div className="flex items-center gap-1 text-xs text-white/50">
        {video.viewCount > 0 ? (
          <><Eye className="w-3 h-3" />{video.viewCount.toLocaleString()}</>
        ) : <span className="text-white/20">—</span>}
      </div>
      
      <div className="flex items-center gap-1 text-xs text-white/50">
        {video.likeCount > 0 ? (
          <><ThumbsUp className="w-3 h-3" />{video.likeCount.toLocaleString()}</>
        ) : <span className="text-white/20">—</span>}
      </div>
      
      <div className="flex items-center gap-1 text-xs text-white/40">
        <Clock className="w-3 h-3" />
        {/* {video.estimatedLength ? `${video.estimatedLength} min` : "—"} */}
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent navigating to detail when clicking star
            handleToggleStar(video.id);
          }}
          disabled={starringId === video.id}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors
            ${video.isStarred 
              ? "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20" 
              : "text-white/20 hover:text-yellow-400 hover:bg-yellow-400/10"}`}
          title={video.isStarred ? "Remove star" : "Star video"}
        >
          {starringId === video.id ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Star className="w-3.5 h-3.5" />
          )}
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent navigating to detail when clicking archive
            handleArchive(video.id);
          }}
          disabled={archivingId === video.id}
          className="w-7 h-7 rounded flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          title="Archive video"
        >
          {archivingId === video.id ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
        
        <button 
          onClick={(e) => e.stopPropagation()} // Prevent navigation
          className="w-7 h-7 rounded flex items-center justify-center text-white/20 hover:text-white/60 transition-colors"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
})}
        </div>
        
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Film className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40">No videos found</p>
            <p className="text-xs text-white/25 mt-1">
              {videos.length === 0 
                ? "Generate your first video to see it here" 
                : "Try adjusting your filters"}
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Videos", value: total, icon: Film },
          { label: "Published", value: publishedVideos.length, icon: Youtube },
          { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye },
          { label: "Starred", value: videos.filter(v => v.isStarred).length, icon: Star },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl bg-white/3 border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-white/30" />
                <span className="text-xs text-white/40">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}