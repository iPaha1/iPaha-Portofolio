// =============================================================================
// GAME FACTORY - Centralized Game Component Factory
// components/(gamification)/game-factory.tsx
// =============================================================================

import React from "react";
import { GameProps } from "./(games)/game-types";
import { ClickHuntGame } from "./(games)/click-hunt-game";
import { TokenRainGame } from "./(games)/token-rain-game";
import { MysteryBoxGame } from "./(games)/mystery-box-game";
import { ReactionGame } from "./(games)/reaction-game";
import { MemoryMatchGame } from "./(games)/memory-match-game";
import { BubbleBurstGame } from "./(games)/bubble-burst-game";
import { SpeedTyperGame } from "./(games)/speed-type-game";
import { DodgeRushGame } from "./(games)/dodge-rush-game";
import { NumberPulseGame } from "./(games)/number-pulse-game";
import { ColourTapGame } from "./(games)/color-tap-game";
import { MoleMashGame } from "./(games)/mole-mash-game";
import { GravityFlipGame } from "./(games)/gravity-flip-game";
import { MathBlitzGame } from "./(games)/math-blitz-game";
import { ShadowTraceGame } from "./(games)/shadow-trace-game";
import { TileFlipGame } from "./(games)/tile-flip-game";
import { PixelPaintGame } from "./(games)/pixel-paint-game";
import { SignalChainGame } from "./(games)/signal-chain-game";
import { RhythmPulseGame } from "./(games)/rhythm-pulse-game";
import { StarConnectGame } from "./(games)/star-connect-game";
import { PrecisionStopGame } from "./(games)/precision-stop-game";
import { ChainReactionGame } from "./(games)/chain-reaction-game";
import { MirrorPainterGame } from "./(games)/mirror-painter-game";
import { WordHuntGame } from "./(games)/word-hunt-game";
import { NeonTrailGame } from "./(games)/neon-trial-game";
import { FrequencyMatchGame } from "./(games)/frequency-match-game";
import { IceSlideGame } from "./(games)/ice-slide-game";
import { SonarSweepGame } from "./(games)/sonar-sweep-game";
import { AuctionBlitzGame } from "./(games)/auction-blitz-game";


export type GameType =
  | "CLICK_HUNT"      | "TOKEN_RAIN"     | "MYSTERY_BOX"    | "REACTION"
  | "MEMORY_MATCH"    | "BUBBLE_BURST"   | "SPEED_TYPER"    | "DODGE_RUSH"
  | "NUMBER_PULSE"    | "COLOUR_TAP"     | "MOLE_MASH"      | "GRAVITY_FLIP"
  | "MATH_BLITZ"      | "SHADOW_TRACE"   | "TILE_FLIP"      | "PIXEL_PAINT"
  | "SIGNAL_CHAIN"    | "RHYTHM_PULSE"   | "STAR_CONNECT"   | "PRECISION_STOP"
  | "CHAIN_REACTION"  | "MIRROR_PAINTER" | "WORD_HUNT"       | "NEON_TRAIL"
  | "FREQUENCY_MATCH" | "ICE_SLIDE"       | "SONAR_SWEEP"     | "AUCTION_BLITZ"; 


interface GameFactoryProps extends GameProps {
  gameType: GameType;
}

export const GameFactory: React.FC<GameFactoryProps> = ({ gameType, ...props }) => {
  switch (gameType) {
    case "CLICK_HUNT":  return <ClickHuntGame {...props} />;
    case "TOKEN_RAIN":  return <TokenRainGame {...props} />;
    case "MYSTERY_BOX":  return <MysteryBoxGame {...props} />;
    case "REACTION":        return <ReactionGame {...props} />;
    case "REACTION":      return <ReactionGame     {...props} />;
    case "MEMORY_MATCH":  return <MemoryMatchGame  {...props} />;
    case "BUBBLE_BURST":  return <BubbleBurstGame  {...props} />;
    case "SPEED_TYPER":   return <SpeedTyperGame   {...props} />;
    case "DODGE_RUSH":    return <DodgeRushGame    {...props} />;
    case "NUMBER_PULSE":  return <NumberPulseGame  {...props} />;
    case "COLOUR_TAP":    return <ColourTapGame    {...props} />;
    case "MOLE_MASH":     return <MoleMashGame     {...props} />;
    case "GRAVITY_FLIP":  return <GravityFlipGame  {...props} />;
    case "MATH_BLITZ":    return <MathBlitzGame    {...props} />;
    case "SHADOW_TRACE":  return <ShadowTraceGame  {...props} />;
    case "TILE_FLIP":     return <TileFlipGame     {...props} />;
    case "TILE_FLIP":     return <TileFlipGame      {...props} />;
    case "PIXEL_PAINT":   return <PixelPaintGame    {...props} />;
    case "SIGNAL_CHAIN":  return <SignalChainGame   {...props} />;
    case "RHYTHM_PULSE":  return <RhythmPulseGame   {...props} />;
    case "STAR_CONNECT":    return <StarConnectGame     {...props} />;
    case "PRECISION_STOP":  return <PrecisionStopGame   {...props} />;
    case "CHAIN_REACTION":  return <ChainReactionGame   {...props} />;
    case "MIRROR_PAINTER":  return <MirrorPainterGame   {...props} />;
    case "WORD_HUNT":       return <WordHuntGame        {...props} />;
    case "NEON_TRAIL":      return <NeonTrailGame       {...props} />;
    case "FREQUENCY_MATCH":  return <FrequencyMatchGame   {...props} />;
    case "ICE_SLIDE":        return <IceSlideGame         {...props} />;
    case "SONAR_SWEEP":      return <SonarSweepGame       {...props} />;
    case "AUCTION_BLITZ":    return <AuctionBlitzGame     {...props} />;
    default:
      return <ClickHuntGame {...props} />;
  }
};

// Export all games for direct use if needed
export {
  ClickHuntGame,    TokenRainGame,    MysteryBoxGame,   ReactionGame,
  MemoryMatchGame,  BubbleBurstGame,  SpeedTyperGame,   DodgeRushGame,
  NumberPulseGame,  ColourTapGame,    MoleMashGame,     GravityFlipGame,
  MathBlitzGame,    ShadowTraceGame,  TileFlipGame,     PixelPaintGame,
  SignalChainGame,  RhythmPulseGame,  StarConnectGame,  PrecisionStopGame,
  ChainReactionGame,MirrorPainterGame,WordHuntGame,     NeonTrailGame,
  FrequencyMatchGame,IceSlideGame,   SonarSweepGame,   AuctionBlitzGame,
};