// =============================================================================
// AI TRIGGER SYSTEM
// lib/game/ai-triggers.ts
// =============================================================================

import { prismadb } from "../db";



interface TriggerContext {
  userId: string;
  currentTime: Date;
  userActivity: {
    lastGamePlayed: Date | null;
    gamesPlayedToday: number;
    tokenBalance: number;
    streak: number;
    timeOnSite: number; // minutes
  };
  siteMetrics: {
    activeUsers: number;
    avgEngagement: number;
    peakHours: number[];
    currentHour: number;
  };
}

interface TriggerAction {
  type: "GAME" | "BONUS" | "NOTIFICATION" | "MULTIPLAYER";
  gameType?: string;
  reward?: number;
  message?: string;
  priority: number;
}

export class AITriggerSystem {
  
  async evaluateTriggers(context: TriggerContext): Promise<TriggerAction | null> {
    // Check all active triggers
    const triggers = await prismadb.aITriggerConfig.findMany({
      where: { isActive: true },
      orderBy: { priority: "desc" },
    });
    
    for (const trigger of triggers) {
      const conditions = JSON.parse(trigger.conditions);
      const shouldTrigger = await this.evaluateConditions(conditions, context);
      
      if (shouldTrigger) {
        // Check cooldown
        if (trigger.lastTriggered) {
          const minutesSince = (Date.now() - trigger.lastTriggered.getTime()) / 60000;
          if (trigger.cooldown && minutesSince < trigger.cooldown) {
            continue;
          }
        }
        
        // Update success count
        await prismadb.aITriggerConfig.update({
          where: { id: trigger.id },
          data: {
            successCount: { increment: 1 },
            lastTriggered: new Date(),
          },
        });
        
        return JSON.parse(trigger.action);
      }
    }
    
    return null;
  }
  
  private async evaluateConditions(conditions: any, context: TriggerContext): Promise<boolean> {
    // Low engagement trigger
    if (conditions.type === "LOW_ENGAGEMENT") {
      const gamesToday = context.userActivity.gamesPlayedToday;
      const timeOnSite = context.userActivity.timeOnSite;
      const avgEngagement = context.siteMetrics.avgEngagement;
      
      return gamesToday === 0 && timeOnSite > 5 && avgEngagement > 50;
    }
    
    // Peak hours trigger
    if (conditions.type === "PEAK_HOURS") {
      const currentHour = context.siteMetrics.currentHour;
      const peakHours = context.siteMetrics.peakHours;
      return peakHours.includes(currentHour);
    }
    
    // Low tokens trigger (incentive)
    if (conditions.type === "LOW_TOKENS") {
      const tokenBalance = context.userActivity.tokenBalance;
      const threshold = conditions.threshold || 50;
      return tokenBalance < threshold;
    }
    
    // High streak trigger (bonus)
    if (conditions.type === "HIGH_STREAK") {
      const streak = context.userActivity.streak;
      const threshold = conditions.threshold || 7;
      return streak >= threshold;
    }
    
    // User idle trigger
    if (conditions.type === "USER_IDLE") {
      const lastGamePlayed = context.userActivity.lastGamePlayed;
      if (!lastGamePlayed) return true;
      
      const hoursSince = (Date.now() - lastGamePlayed.getTime()) / 3600000;
      const threshold = conditions.threshold || 2;
      return hoursSince >= threshold;
    }
    
    // Random chance trigger
    if (conditions.type === "RANDOM_CHANCE") {
      const chance = conditions.chance || 0.2;
      return Math.random() < chance;
    }
    
    return false;
  }
  
  async generateFlashEvent(): Promise<TriggerAction | null> {
    // AI decides when to create flash events based on site metrics
    const metrics = await this.getSiteMetrics();
    
    // Trigger if engagement is dropping
    if (metrics.avgEngagement < 40) {
      return {
        type: "GAME",
        gameType: "TOKEN_RAIN",
        reward: 50,
        message: "⚡ Flash Event! Double rewards for 5 minutes!",
        priority: 10,
      };
    }
    
    // Trigger if active users are high (competitive mode)
    if (metrics.activeUsers > 50) {
      return {
        type: "MULTIPLAYER",
        message: "🔥 50+ users online! Join the multiplayer event!",
        priority: 8,
      };
    }
    
    return null;
  }
  
  private async getSiteMetrics() {
    // Get real-time site metrics
    const activeUsers = await prismadb.userSession.count({
      where: {
        expiresAt: { gt: new Date() },
        lastUsedAt: { gt: new Date(Date.now() - 5 * 60000) }, // Last 5 minutes
      },
    });
    
    const currentHour = new Date().getHours();
    
    return {
      activeUsers,
      avgEngagement: 60, // Placeholder - would calculate from actual metrics
      peakHours: [9, 10, 11, 18, 19, 20], // UK peak hours
      currentHour,
    };
  }
}

// Singleton instance
export const aiTriggerSystem = new AITriggerSystem();