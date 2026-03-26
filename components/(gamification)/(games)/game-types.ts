// =============================================================================
// BASE GAME INTERFACE - Shared Types
// components/(gamification)/(games)/game-types.ts
// =============================================================================

export interface GameProps {
  gameId: string;
  rewardTokens: number;
  bonusTokens?: number;
  duration: number;
  onComplete: (reward: number, score?: number) => void;
  onCancel?: () => void;
  soundEnabled?: boolean;
  isFlash?: boolean;
}

export interface GameResult {
  reward: number;
  score: number;
  metrics?: {
    accuracy?: number;
    reactionTime?: number;
    clicks?: number;
    combos?: number;
  };
}

export interface GameState {
  isPlaying: boolean;
  isComplete: boolean;
  score: number;
  timeRemaining: number;
  multiplier: number;
}