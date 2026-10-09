// =============================================================================
// YouTube Content Studio — Custom React Hooks
// hooks/useYoutube.ts
// =============================================================================

import type {
  YoutubeCreatorProfile,
  YoutubeVideo,
  YoutubeWeeklyBatch,
  YoutubeContentIdea,
  YoutubeCalendarEntry,
  YoutubeChannelGoal,
  YoutubeAnalyticsSnapshot,
  StudioDashboardStats,
  GenerateWeeklyRequest,
  VideoFilterOptions,
  PaginatedResponse,
} from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-types";
import { useState, useEffect, useCallback } from "react";



// ─── Base fetch helper ────────────────────────────────────────────────────────
 
async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error || "Request failed" };
    return { data: json.data ?? json };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }
}
 
function buildBase(userId: string): string {
  return `/api/admin/${userId}/youtube`;
}
 
// ─── useYoutubeProfile ────────────────────────────────────────────────────────
 
export function useYoutubeProfile(userId: string) {
  const [profile, setProfile] = useState<YoutubeCreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  const fetch = useCallback(async () => {
    setLoading(true);
    const result = await apiFetch<YoutubeCreatorProfile>(`${buildBase(userId)}/profile`);
    if (result.error) setError(result.error);
    else setProfile(result.data!);
    setLoading(false);
  }, [userId]);
 
  useEffect(() => { fetch(); }, [fetch]);
 
  const update = async (data: Partial<YoutubeCreatorProfile>) => {
    const result = await apiFetch<YoutubeCreatorProfile>(`${buildBase(userId)}/profile`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!result.error && result.data) setProfile(result.data);
    return result;
  };
 
  return { profile, loading, error, refetch: fetch, update };
}
 
// ─── useDashboardStats ───────────────────────────────────────────────────────
 
export function useDashboardStats(userId: string) {
  const [stats, setStats]   = useState<StudioDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    apiFetch<StudioDashboardStats>(`${buildBase(userId)}/dashboard`).then(r => {
      if (r.data) setStats(r.data);
      setLoading(false);
    });
  }, [userId]);
 
  return { stats, loading };
}
 
// ─── useWeeklyGenerator ───────────────────────────────────────────────────────
 
export function useWeeklyGenerator(userId: string) {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [result, setResult]     = useState<{
    batch: YoutubeWeeklyBatch;
    videos: YoutubeVideo[];
  } | null>(null);
 
  const generate = async (req: GenerateWeeklyRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
 
    const res = await apiFetch<{ batch: YoutubeWeeklyBatch; videos: YoutubeVideo[] }>(
      `${buildBase(userId)}/generate`,
      { method: "POST", body: JSON.stringify(req) }
    );
 
    if (res.error) setError(res.error);
    else setResult(res.data!);
    setLoading(false);
    return res;
  };
 
  const reset = () => { setResult(null); setError(null); };
 
  return { generate, loading, error, result, reset };
}
 
// ─── useVideos ────────────────────────────────────────────────────────────────
 
// In use-youtube.ts - fix the useVideos hook

export function useVideos(userId: string, filters: VideoFilterOptions = {}) {
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status)    params.set("status",    filters.status);
      if (filters.search)    params.set("search",    filters.search);
      if (filters.sortBy)    params.set("sortBy",    filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
      if (filters.page)      params.set("page",      String(filters.page));
      if (filters.pageSize)  params.set("pageSize",  String(filters.pageSize));
      if (filters.isStarred) params.set("isStarred", "true");

      const response = await apiFetch<any>(
        `${buildBase(userId)}/videos?${params.toString()}`
      );

      console.log("[useVideos] API response:", response);

      // Handle the response format: { data: videos, total, page, pageSize }
      const apiData = response.data;
      
      if (apiData && Array.isArray(apiData.data)) {
        // Format: { data: videos, total }
        setVideos(apiData.data);
        setTotal(apiData.total || apiData.data.length);
      } else if (Array.isArray(apiData)) {
        // Format: direct array
        setVideos(apiData);
        setTotal(apiData.length);
      } else {
        console.error("[useVideos] Unexpected response format:", apiData);
        setVideos([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("[useVideos] Failed to fetch videos:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch videos");
      setVideos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [userId, JSON.stringify(filters)]);

  useEffect(() => { 
    fetchVideos(); 
  }, [fetchVideos]);

  const updateVideo = async (videoId: string, data: Partial<YoutubeVideo>) => {
    const res = await apiFetch<YoutubeVideo>(
      `${buildBase(userId)}/videos/${videoId}`,
      { method: "PATCH", body: JSON.stringify(data) }
    );
    if (!res.error && res.data) {
      setVideos(prev => prev.map(v => v.id === videoId ? { ...v, ...res.data } : v));
    }
    return res;
  };

  const archiveVideo = async (videoId: string) => {
    const res = await apiFetch(`${buildBase(userId)}/videos/${videoId}`, { method: "DELETE" });
    if (!res.error) {
      setVideos(prev => prev.filter(v => v.id !== videoId));
      setTotal(prev => prev - 1);
    }
    return res;
  };

  const toggleStar = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;
    return updateVideo(videoId, { isStarred: !video.isStarred });
  };

  return { videos, total, loading, error, refetch: fetchVideos, updateVideo, archiveVideo, toggleStar };
}
 
// ─── useVideo (single) ────────────────────────────────────────────────────────
 
export function useVideo(userId: string, videoId: string) {
  const [video, setVideo] = useState<YoutubeVideo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVideo = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    const result = await apiFetch<YoutubeVideo>(`${buildBase(userId)}/videos/${videoId}`);
    if (result.data) {
      // Handle response - it might be nested
      const videoData = (result.data as any).data || result.data;
      setVideo(videoData);
    }
    setLoading(false);
  }, [userId, videoId]);

  useEffect(() => { fetchVideo(); }, [fetchVideo]);

  const update = async (data: Partial<YoutubeVideo>) => {
    const res = await apiFetch<YoutubeVideo>(
      `${buildBase(userId)}/videos/${videoId}`,
      { method: "PATCH", body: JSON.stringify(data) }
    );
    if (!res.error && res.data) {
      const updatedData = (res.data as any).data || res.data;
      setVideo(updatedData);
    }
    return res;
  };

  return { video, loading, update, refetch: fetchVideo };
}
 
// ─── useSectionRegen ─────────────────────────────────────────────────────────
 
export function useSectionRegen(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
 
  const regen = async (params: {
    videoId?: string;
    section: string;
    currentContent: string;
    videoTitle: string;
    tone: string;
    instruction?: string;
    type?: "section" | "social_posts";
  }) => {
    setLoading(true);
    setError(null);
    const res = await apiFetch<string | Record<string, string>>(
      `${buildBase(userId)}/regen`,
      { method: "POST", body: JSON.stringify(params) }
    );
    if (res.error) setError(res.error);
    setLoading(false);
    return res;
  };
 
  return { regen, loading, error };
}
 
// ─── useIdeas ─────────────────────────────────────────────────────────────────
 
export function useIdeas(userId: string, options: { saved?: boolean; used?: boolean } = {}) {
  const [ideas, setIdeas]     = useState<YoutubeContentIdea[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
 
  // In useIdeas hook

const fetchIdeas = useCallback(async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    if (options.saved !== undefined) params.set("saved", String(options.saved));
    if (options.used !== undefined) params.set("used", String(options.used));

    const response = await apiFetch<any>(
      `${buildBase(userId)}/ideas?${params.toString()}`
    );

    const apiData = response.data;
    console.log("[useIdeas] API response:", apiData);
    
    // Handle both response formats:
    // Format 1: apiData is array directly
    // Format 2: apiData is { data: array, total: number }
    let ideasArray: YoutubeContentIdea[] = [];
    let totalCount = 0;
    
    if (Array.isArray(apiData)) {
      // Direct array format
      ideasArray = apiData;
      totalCount = apiData.length;
    } else if (apiData && Array.isArray(apiData.data)) {
      // Wrapped format
      ideasArray = apiData.data;
      totalCount = apiData.total ?? apiData.data.length;
    } else {
      console.error("[useIdeas] Unexpected API response format:", apiData);
      setIdeas([]);
      setTotal(0);
      return;
    }
    
    setIdeas(ideasArray);
    setTotal(totalCount);
  } catch (err) {
    console.error("[useIdeas] Failed to fetch ideas:", err);
    setIdeas([]);
    setTotal(0);
  } finally {
    setLoading(false);
  }
}, [userId, JSON.stringify(options)]);

 
  const generateIdeas = async (params: {
    count?: number; themes?: string[]; tone?: string;
    targetAudience?: string; avoidTopics?: string[];
  }) => {
    setGenerating(true);
    const res = await apiFetch<YoutubeContentIdea[]>(
      `${buildBase(userId)}/ideas`,
      { method: "POST", body: JSON.stringify(params) }
    );
    if (!res.error) await fetchIdeas(); // refresh list
    setGenerating(false);
    return res;
  };
 
  const toggleSaved = async (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;
    await apiFetch(`${buildBase(userId)}/ideas/${ideaId}`, {
      method: "PATCH",
      body: JSON.stringify({ isSaved: !idea.isSaved }),
    });
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, isSaved: !i.isSaved } : i));
  };
 
  const deleteIdea = async (ideaId: string) => {
    await apiFetch(`${buildBase(userId)}/ideas/${ideaId}`, { method: "DELETE" });
    setIdeas(prev => prev.filter(i => i.id !== ideaId));
  };
 
  return { ideas, total, loading, generating, refetch: fetchIdeas, generateIdeas, toggleSaved, deleteIdea };
}
 
// ─── useCalendar ─────────────────────────────────────────────────────────────
 
export function useCalendar(userId: string, from?: Date, to?: Date) {
  const [entries, setEntries] = useState<YoutubeCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
 
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from.toISOString());
    if (to)   params.set("to",   to.toISOString());
    const res = await apiFetch<YoutubeCalendarEntry[]>(
      `${buildBase(userId)}/calendar?${params.toString()}`
    );
    setEntries(res.data ?? []);
    setLoading(false);
  }, [userId, from?.toISOString(), to?.toISOString()]);
 
  useEffect(() => { fetchEntries(); }, [fetchEntries]);
 
  const schedule = async (data: {
    videoId?: string; title: string; scheduledDate: Date;
    status?: string; color?: string; notes?: string;
  }) => {
    const res = await apiFetch<YoutubeCalendarEntry>(
      `${buildBase(userId)}/calendar`,
      { method: "POST", body: JSON.stringify({ ...data, scheduledDate: data.scheduledDate.toISOString() }) }
    );
    if (!res.error) await fetchEntries();
    return res;
  };
 
  return { entries, loading, refetch: fetchEntries, schedule };
}
 
// ─── useGoals ─────────────────────────────────────────────────────────────────
 
export function useGoals(userId: string) {
  const [goals, setGoals]     = useState<YoutubeChannelGoal[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    apiFetch<YoutubeChannelGoal[]>(`${buildBase(userId)}/goals`).then(r => {
      setGoals(r.data ?? []);
      setLoading(false);
    });
  }, [userId]);
 
  const createGoal = async (data: {
    title: string; targetMetric: string; targetValue: number;
    targetDate?: string; description?: string;
  }) => {
    const res = await apiFetch<YoutubeChannelGoal>(
      `${buildBase(userId)}/goals`,
      { method: "POST", body: JSON.stringify(data) }
    );
    if (!res.error && res.data) setGoals(prev => [...prev, res.data!]);
    return res;
  };
 
  return { goals, loading, createGoal };
}
 
// ─── useAnalytics ─────────────────────────────────────────────────────────────
 
export function useAnalytics(userId: string) {
  const [snapshots, setSnapshots] = useState<YoutubeAnalyticsSnapshot[]>([]);
  const [topVideos, setTopVideos] = useState<YoutubeVideo[]>([]);
  const [loading, setLoading]     = useState(true);
 
  useEffect(() => {
    apiFetch<{ snapshots: YoutubeAnalyticsSnapshot[]; topVideos: YoutubeVideo[] }>(
      `${buildBase(userId)}/analytics`
    ).then(r => {
      setSnapshots(r.data?.snapshots ?? []);
      setTopVideos(r.data?.topVideos ?? []);
      setLoading(false);
    });
  }, [userId]);
 
  return { snapshots, topVideos, loading };
}
 
// ─── useScriptScore ───────────────────────────────────────────────────────────
 
export function useScriptScore(userId: string) {
  const [loading, setLoading] = useState(false);
  const [score, setScore]     = useState<{
    overallScore: number; hookStrength: number; clarity: number;
    originality: number; deliverability: number; seoStrength: number;
    feedback: string; topStrengths: string[]; improvements: string[];
  } | null>(null);
 
  const scoreScript = async (script: string, title: string, videoId?: string) => {
    setLoading(true);
    const res = await apiFetch<typeof score>(
      `${buildBase(userId)}/score`,
      { method: "POST", body: JSON.stringify({ script, title, videoId }) }
    );
    if (res.data) setScore(res.data);
    setLoading(false);
    return res;
  };
 
  return { scoreScript, score, loading };
}
 
// ─── useNarrativeArc ─────────────────────────────────────────────────────────
 
export function useNarrativeArc(userId: string) {
  const [arc, setArc]         = useState<{
    arcSummary: string; currentTheme: string; narrativeGap: string;
    nextVideoDirection: string; suggestedTitle: string; reasoning: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
 
  const analyse = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<typeof arc>(`${buildBase(userId)}/narrative`);
    if (res.data) setArc(res.data);
    setLoading(false);
  }, [userId]);
 
  useEffect(() => { analyse(); }, [analyse]);
 
  return { arc, loading, refetch: analyse };
}
 
// ─── useBatches ───────────────────────────────────────────────────────────────
 
export function useBatches(userId: string) {
  const [batches, setBatches] = useState<YoutubeWeeklyBatch[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    apiFetch<YoutubeWeeklyBatch[]>(`${buildBase(userId)}/batches`).then(r => {
      setBatches(r.data ?? []);
      setLoading(false);
    });
  }, [userId]);
 
  return { batches, loading };
}
 

// In use-youtube.ts - add this hook

export function useSaveVideo(userId: string) {
  const [saving, setSaving] = useState(false);
  const [savedVideoId, setSavedVideoId] = useState<string | null>(null);

  const saveVideo = async (videoData: any) => {
    setSaving(true);
    try {
      const response = await apiFetch<any>(
        `/api/admin/${userId}/youtube/videos`,
        {
          method: "POST",
          body: JSON.stringify(videoData),
        }
      );
      
      if (response.error) {
        console.error("Failed to save video:", response.error);
        return { success: false, error: response.error };
      }
      
      setSavedVideoId(response.data?.id || null);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error saving video:", error);
      return { success: false, error: String(error) };
    } finally {
      setSaving(false);
    }
  };

  return { saveVideo, saving, savedVideoId };
}


// Add to use-youtube.ts

// Hook for generating video from idea
export function useGenerateVideoFromIdea(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (params: {
    ideaId: string;
    title: string;
    angle?: string;
    hook?: string;
    whyNow?: string;
    themes?: string[];
    targetEmotion?: string;
    tone: string;
    estimatedLength: number;
    additionalNotes?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    const res = await apiFetch<any>(
      `${buildBase(userId)}/generate-from-idea`,
      { method: "POST", body: JSON.stringify(params) }
    );
    
    if (res.error) setError(res.error);
    setLoading(false);
    return res;
  };

  return { generate, loading, error };
}

// Hook for updating idea note
export function useUpdateIdeaNote(userId: string) {
  const [loading, setLoading] = useState(false);

  const updateNote = async (ideaId: string, note: string) => {
    setLoading(true);
    const res = await apiFetch(
      `/api/admin/${userId}/youtube/ideas/${ideaId}/note`,
      { method: "PATCH", body: JSON.stringify({ userNotes: note }) }
    );
    setLoading(false);
    return res;
  };

  return { updateNote, loading };
}

