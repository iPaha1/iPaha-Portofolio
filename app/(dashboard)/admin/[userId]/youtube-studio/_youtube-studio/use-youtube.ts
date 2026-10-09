// =============================================================================
// YouTube Content Studio — Custom React Hooks
// hooks/useYoutube.ts
// =============================================================================

import { useState, useEffect, useCallback } from "react";
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
} from "./youtube-studio-types";

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
 
export function useVideos(userId: string, filters: VideoFilterOptions = {}) {
  const [videos, setVideos]   = useState<YoutubeVideo[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
 
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status)    params.set("status",    filters.status);
    if (filters.search)    params.set("search",    filters.search);
    if (filters.sortBy)    params.set("sortBy",    filters.sortBy);
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
    if (filters.page)      params.set("page",      String(filters.page));
    if (filters.pageSize)  params.set("pageSize",  String(filters.pageSize));
    if (filters.isStarred) params.set("isStarred", "true");
 
    const res = await apiFetch<PaginatedResponse<YoutubeVideo>>(
      `${buildBase(userId)}/videos?${params.toString()}`
    );
    if (res.error) {
      setError(res.error);
      setVideos([]);   // always leave videos as an array, never undefined
    } else {
      setVideos(res.data?.data ?? []);
      setTotal(res.data?.total ?? 0);
    }
    setLoading(false);
  }, [userId, JSON.stringify(filters)]);
 
  useEffect(() => { fetchVideos(); }, [fetchVideos]);
 
  const updateVideo = async (videoId: string, data: Partial<YoutubeVideo>) => {
    const res = await apiFetch<YoutubeVideo>(
      `${buildBase(userId)}/videos/${videoId}`,
      { method: "PATCH", body: JSON.stringify(data) }
    );
    if (!res.error) setVideos(prev => prev.map(v => v.id === videoId ? { ...v, ...res.data } : v));
    return res;
  };
 
  const archiveVideo = async (videoId: string) => {
    const res = await apiFetch(`${buildBase(userId)}/videos/${videoId}`, { method: "DELETE" });
    if (!res.error) setVideos(prev => prev.filter(v => v.id !== videoId));
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
  const [video, setVideo]     = useState<YoutubeVideo | null>(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    if (!videoId) return;
    apiFetch<YoutubeVideo>(`${buildBase(userId)}/videos/${videoId}`).then(r => {
      if (r.data) setVideo(r.data);
      setLoading(false);
    });
  }, [userId, videoId]);
 
  const update = async (data: Partial<YoutubeVideo>) => {
    const res = await apiFetch<YoutubeVideo>(
      `${buildBase(userId)}/videos/${videoId}`,
      { method: "PATCH", body: JSON.stringify(data) }
    );
    if (!res.error && res.data) setVideo(res.data);
    return res;
  };
 
  return { video, loading, update };
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

    // FIXED: Use response.data directly (not response.data.data)
    const apiData = response.data || response;   // safety in case your apiFetch wrapper varies

    setIdeas(apiData.data ?? []);
    setTotal(apiData.total ?? 0);
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
 