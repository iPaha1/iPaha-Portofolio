// =============================================================================
// LEADERBOARD COMPONENT
// components/game/Leaderboard.tsx
// =============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Crown, Star, Flame } from "lucide-react";
import { useGame } from "./game-provider";


interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  previousRank: number | null;
  isCurrentUser: boolean;
}

interface LeaderboardProps {
  type: "WEEKLY_TOKENS" | "MONTHLY_TOKENS" | "ALL_TIME_TOKENS" | "GAME_MASTER";
  period?: "DAILY" | "WEEKLY" | "MONTHLY" | "ALL_TIME";
  limit?: number;
  showHeader?: boolean;
}

export function Leaderboard({ type, period = "WEEKLY", limit = 50, showHeader = true }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const { tokenBalance } = useGame();

  useEffect(() => {
    fetchLeaderboard();
  }, [type, period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/game/leaderboard?type=${type}&period=${period}&limit=${limit}`);
      const data = await res.json();
      setEntries(data.entries);
      setUserRank(data.userRank);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center text-sm font-mono text-gray-400">{rank}</span>;
  };

  const getRankChangeIcon = (previousRank: number | null, currentRank: number) => {
    if (!previousRank) return null;
    if (previousRank > currentRank) return <TrendingUp className="w-3 h-3 text-green-400" />;
    if (previousRank < currentRank) return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden">
      {showHeader && (
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h2 className="text-white font-bold text-lg">
                {type === "WEEKLY_TOKENS" && "Weekly Token Earners"}
                {type === "MONTHLY_TOKENS" && "Monthly Token Earners"}
                {type === "ALL_TIME_TOKENS" && "All-Time Legends"}
                {type === "GAME_MASTER" && "Game Masters"}
              </h2>
            </div>
            <span className="text-xs text-gray-400">Updated daily</span>
          </div>
        </div>
      )}

      <div className="divide-y divide-white/5">
        {entries.slice(0, limit).map((entry) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`px-6 py-3 flex items-center gap-4 ${
              entry.isCurrentUser ? "bg-purple-500/10 border-l-4 border-purple-500" : ""
            }`}
          >
            <div className="w-10 flex justify-center">
              {getRankIcon(entry.rank)}
            </div>
            
            <div className="flex-1 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  entry.displayName?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  {entry.displayName}
                  {entry.isCurrentUser && <span className="ml-2 text-xs text-purple-400">(You)</span>}
                </p>
                {entry.previousRank && (
                  <div className="flex items-center gap-1 mt-0.5">
                    {getRankChangeIcon(entry.previousRank, entry.rank)}
                    <span className="text-[10px] text-gray-500">
                      {entry.previousRank !== entry.rank ? `#${entry.previousRank} → #${entry.rank}` : `#${entry.rank}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400" />
              <span className="text-white font-bold">{entry.score.toLocaleString()}</span>
              <span className="text-xs text-gray-400">pts</span>
            </div>
          </motion.div>
        ))}
      </div>

      {userRank && userRank.rank > limit && (
        <div className="px-6 py-3 border-t border-white/10 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 flex justify-center">
              <span className="w-5 text-center text-sm font-mono text-gray-400">{userRank.rank}</span>
            </div>
            <div className="flex-1 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                {userRank.displayName?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  {userRank.displayName}
                  <span className="ml-2 text-xs text-purple-400">(You)</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400" />
              <span className="text-white font-bold">{userRank.score.toLocaleString()}</span>
              <span className="text-xs text-gray-400">pts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}