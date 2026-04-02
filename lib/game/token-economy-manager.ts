// =============================================================================
// lib/game/token-economy-manager.ts
// 
// Controls token rewards to ensure sustainable economics.
// Designed to make earning $1 take 30+ days of consistent gameplay.
// =============================================================================

export interface RewardCalculation {
  baseReward: number;
  streakMultiplier: number;
  finalReward: number;
  usdValue: number;
  daysToEarnOneDollar: number;
}

export interface GameRewardConfig {
  gameType: "memory" | "quiz" | "puzzle" | "daily_challenge";
  baseReward: number;      // Will be overridden by economy rules
  maxDailyReward: number;  // Cap total rewards per day
}

class TokenEconomyManager {
  // ECONOMY CONSTANTS - ADJUST THESE FOR DIFFICULTY
  private readonly TOKEN_VALUE_USD = 0.00083; // Explorer package rate ($10/12,000 tokens)
  private readonly TARGET_DAYS_FOR_1USD = 30; // Want 30+ days to earn $1
  private readonly MAX_DAILY_TOKENS = Math.floor(1 / this.TOKEN_VALUE_USD / this.TARGET_DAYS_FOR_1USD);
  
  // Calculated: $1 ÷ 30 days = $0.033/day = ~40 tokens/day at $0.00083/token
  // Therefore MAX_DAILY_TOKENS = 40
  
  private readonly BASE_REWARDS = {
    memory: { win: 3, lose: 1, draw: 2 },
    quiz: { perfect: 5, good: 3, partial: 2, fail: 1 },
    puzzle: { solved: 4, attempted: 1 },
    daily_challenge: { completed: 8, participated: 2 }
  };
  
  private readonly STREAK_CAP = 14; // Streak bonus stops growing after 14 days
  private readonly STREAK_MULTIPLIER_MAX = 1.5; // Max 50% bonus at 14+ days
  
  constructor() {
    console.log(`[TokenEconomy] Max daily tokens: ${this.MAX_DAILY_TOKENS}`);
    console.log(`[TokenEconomy] Days to earn $1: ${this.TARGET_DAYS_FOR_1USD}`);
    console.log(`[TokenEconomy] Daily value: $${(this.MAX_DAILY_TOKENS * this.TOKEN_VALUE_USD).toFixed(3)}`);
  }
  
  /**
   * Calculate appropriate token reward based on game performance
   * This is the MAIN function you'll call from your game routes
   */
  calculateReward(
    gameType: keyof typeof this.BASE_REWARDS,
    performance: "win" | "lose" | "draw" | "perfect" | "good" | "partial" | "fail" | "solved" | "attempted" | "completed" | "participated",
    currentStreak: number = 0,
    todaysEarnings: number = 0
  ): RewardCalculation {
    
    // Step 1: Get base reward for this game/performance
    let baseReward = this.getBaseReward(gameType, performance);
    
    // Step 2: Apply streak multiplier (capped and reduced)
    let streakMultiplier = this.calculateStreakMultiplier(currentStreak);
    
    // Step 3: Calculate raw reward
    let rawReward = Math.floor(baseReward * streakMultiplier);
    
    // Step 4: Apply daily cap (MOST IMPORTANT - prevents farming)
    let remainingDaily = Math.max(0, this.MAX_DAILY_TOKENS - todaysEarnings);
    let finalReward = Math.min(rawReward, remainingDaily);
    
    // Step 5: If user hit daily cap, reward is 0
    if (todaysEarnings >= this.MAX_DAILY_TOKENS) {
      finalReward = 0;
    }
    
    // Step 6: Calculate USD value and economics
    const usdValue = finalReward * this.TOKEN_VALUE_USD;
    const daysToEarnOneDollar = this.TARGET_DAYS_FOR_1USD;
    
    return {
      baseReward,
      streakMultiplier,
      finalReward,
      usdValue,
      daysToEarnOneDollar
    };
  }
  
  /**
   * Get base reward (dramatically reduced from typical game rewards)
   */
  private getBaseReward(
    gameType: keyof typeof this.BASE_REWARDS,
    performance: string
  ): number {
    switch(gameType) {
      case "memory": {
        const rewards = this.BASE_REWARDS.memory;
        if (performance === "win") return rewards.win;
        if (performance === "lose") return rewards.lose;
        return rewards.draw;
      }
        
      case "quiz": {
        const rewards = this.BASE_REWARDS.quiz;
        if (performance === "perfect") return rewards.perfect;
        if (performance === "good") return rewards.good;
        if (performance === "partial") return rewards.partial;
        return rewards.fail;
      }
        
      case "puzzle": {
        const rewards = this.BASE_REWARDS.puzzle;
        if (performance === "solved") return rewards.solved;
        return rewards.attempted;
      }
        
      case "daily_challenge": {
        const rewards = this.BASE_REWARDS.daily_challenge;
        if (performance === "completed") return rewards.completed;
        return rewards.participated;
      }
        
      default:
        return 1; // Absolute minimum
    }
  }
  
  /**
   * Calculate streak multiplier (reduced from typical games)
   * Day 1-2: 1.0x
   * Day 3-6: 1.1x
   * Day 7-13: 1.2x
   * Day 14+: 1.5x (capped)
   */
  private calculateStreakMultiplier(streak: number): number {
    if (streak < 3) return 1.0;
    if (streak < 7) return 1.1;
    if (streak < 14) return 1.2;
    return this.STREAK_MULTIPLIER_MAX;
  }
  
  /**
   * Get user's total possible daily earnings (for UI display)
   */
  getMaxDailyTokens(): number {
    return this.MAX_DAILY_TOKENS;
  }
  
  /**
   * Calculate time to earn X tokens
   */
  calculateTimeToEarn(targetTokens: number, avgDailyPlay: number = 5): string {
    const daysNeeded = targetTokens / (this.MAX_DAILY_TOKENS * (avgDailyPlay / 10));
    const weeks = Math.floor(daysNeeded / 7);
    const days = Math.ceil(daysNeeded % 7);
    
    if (weeks > 0) {
      return `${weeks} week${weeks > 1 ? 's' : ''}${days > 0 ? ` and ${days} day${days > 1 ? 's' : ''}` : ''}`;
    }
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  
  /**
   * Get economics report (for debugging/admin)
   */
  getEconomicsReport() {
    return {
      tokenValueUSD: this.TOKEN_VALUE_USD,
      maxDailyTokens: this.MAX_DAILY_TOKENS,
      dailyUSDValue: (this.MAX_DAILY_TOKENS * this.TOKEN_VALUE_USD).toFixed(3),
      daysForOneDollar: this.TARGET_DAYS_FOR_1USD,
      streakCap: this.STREAK_CAP,
      maxMultiplier: this.STREAK_MULTIPLIER_MAX,
      monthlyEarningsMax: (this.MAX_DAILY_TOKENS * 30 * this.TOKEN_VALUE_USD).toFixed(2)
    };
  }
}

// Singleton instance
export const tokenEconomy = new TokenEconomyManager();