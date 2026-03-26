// =============================================================================
// ACHIEVEMENTS PANEL
// components/game/AchievementsPanel.tsx
// =============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Award, Lock, Sparkles, TrendingUp, Zap, Target, Gift, Flame, Crown, Medal } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";
  rewardTokens: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  totalRequired?: number;
  isHidden?: boolean;
}

const RARITY_CONFIG = {
  COMMON: { color: "#6b7280", bg: "bg-gray-500/10", border: "border-gray-500/30", label: "Common" },
  RARE: { color: "#3b82f6", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "Rare" },
  EPIC: { color: "#8b5cf6", bg: "bg-purple-500/10", border: "border-purple-500/30", label: "Epic" },
  LEGENDARY: { color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Legendary" },
  MYTHIC: { color: "#ec4899", bg: "bg-pink-500/10", border: "border-pink-500/30", label: "Mythic" },
};

const RARITY_ICONS = {
  COMMON: <Medal className="w-4 h-4" />,
  RARE: <TrendingUp className="w-4 h-4" />,
  EPIC: <Zap className="w-4 h-4" />,
  LEGENDARY: <Crown className="w-4 h-4" />,
  MYTHIC: <Sparkles className="w-4 h-4" />,
};

export function AchievementsPanel() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stats, setStats] = useState({ total: 0, unlocked: 0, totalRewards: 0 });

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const res = await fetch("/api/game/achievements");
      const data = await res.json();
      setAchievements(data.achievements);
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Award: <Award className="w-6 h-6" />,
      Target: <Target className="w-6 h-6" />,
      Flame: <Flame className="w-6 h-6" />,
      Crown: <Crown className="w-6 h-6" />,
      Gift: <Gift className="w-6 h-6" />,
      Zap: <Zap className="w-6 h-6" />,
      Sparkles: <Sparkles className="w-6 h-6" />,
    };
    return icons[iconName] || <Award className="w-6 h-6" />;
  };

  const categories = [
    { id: "all", name: "All", icon: Award },
    { id: "progress", name: "In Progress", icon: TrendingUp },
    { id: "completed", name: "Completed", icon: Crown },
    { id: "hidden", name: "Hidden", icon: Lock },
  ];

  const filteredAchievements = achievements.filter(a => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "progress") return !a.unlocked && a.progress !== undefined;
    if (selectedCategory === "completed") return a.unlocked;
    if (selectedCategory === "hidden") return a.isHidden;
    return true;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const completionPercentage = stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-400" />
            <h2 className="text-white font-bold text-xl">Achievements</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{stats.unlocked}/{stats.total}</p>
            <p className="text-xs text-gray-400">{Math.round(completionPercentage)}% Complete</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          />
        </div>
        
        <p className="text-sm text-gray-400 mt-3">
          Total rewards earned: <span className="text-yellow-400 font-bold">{stats.totalRewards.toLocaleString()} tokens</span>
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              selectedCategory === cat.id
                ? "bg-purple-500 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.name}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAchievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative p-4 rounded-xl border transition-all ${
              achievement.unlocked
                ? RARITY_CONFIG[achievement.rarity].bg + " border " + RARITY_CONFIG[achievement.rarity].border
                : "bg-white/5 border-white/10"
            }`}
          >
            {achievement.unlocked && (
              <div className="absolute top-3 right-3">
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
              </div>
            )}
            
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  achievement.unlocked
                    ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                    : "bg-white/5"
                }`}
                style={{ color: RARITY_CONFIG[achievement.rarity].color }}
              >
                {achievement.unlocked ? getIcon(achievement.icon) : <Lock className="w-6 h-6" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-bold text-sm">{achievement.name}</h3>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                    style={{ backgroundColor: `${RARITY_CONFIG[achievement.rarity].color}20`, color: RARITY_CONFIG[achievement.rarity].color }}
                  >
                    {RARITY_ICONS[achievement.rarity]}
                    {RARITY_CONFIG[achievement.rarity].label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{achievement.description}</p>
                
                {/* Progress Bar */}
                {achievement.progress !== undefined && achievement.totalRequired && !achievement.unlocked && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.totalRequired}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${(achievement.progress / achievement.totalRequired) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Reward */}
                {achievement.rewardTokens > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-yellow-400">
                    <Gift className="w-3 h-3" />
                    <span>+{achievement.rewardTokens} tokens</span>
                  </div>
                )}
                
                {/* Unlocked Date */}
                {achievement.unlockedAt && (
                  <p className="text-[10px] text-gray-500 mt-2">
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}