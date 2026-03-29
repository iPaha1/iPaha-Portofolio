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
import { LaserGridGame } from "./(games)/laser-grid-game";
import { SequenceMemoryGame } from "./(games)/sequence-memory-game";
import { VaultCrackerGame } from "./(games)/vault-cracker-game";
import { NeonTyperaceGame } from "./(games)/neon-type-racer-game";
import { OrbitSlingshotGame } from "./(games)/orbit-slingshot-game";
import { ColorFloodGame } from "./(games)/color-floor-game";
import { PulseCatcherGame } from "./(games)/pulse-catcher-game";
import { ShadowMatchGame } from "./(games)/shadow-match-game";
import { WarpSpeedGame } from "./(games)/warp-speed-game";
import { MindTheGapGame } from "./(games)/mind-the-gap-game";
import { ParticlePainterGame } from "./(games)/particles-painter-games";
import { FrequencySurferGame } from "./(games)/frequency-suffer-game";
import { HeistLaserGame } from "./(games)/heist-laser-game";
import { ChainReactionGamePartTwo } from "./(games)/chain-reaction-game-part-two";
import { BlackHoleGame } from "./(games)/black-hole-game";
import { PixelStormGame } from "./(games)/pixel-storm-game";
import { PlasmaSnakeGame } from "./(games)/plasma-snake-game";
import { MindMeldGame } from "./(games)/mind-meld-game";
import { NeonPinballGame } from "./(games)/neon-pinball-game";
import { TimeFreezeGame } from "./(games)/time-freezer-game";
import { EchoChamberGame } from "./(games)/echo-chamber-game";
import { QuantumCollapseGame } from "./(games)/quantum-collapse-game";


export type GameType =
  | "CLICK_HUNT"      | "TOKEN_RAIN"     | "MYSTERY_BOX"    | "REACTION"
  | "MEMORY_MATCH"    | "BUBBLE_BURST"   | "SPEED_TYPER"    | "DODGE_RUSH"
  | "NUMBER_PULSE"    | "COLOUR_TAP"     | "MOLE_MASH"      | "GRAVITY_FLIP"
  | "MATH_BLITZ"      | "SHADOW_TRACE"   | "TILE_FLIP"      | "PIXEL_PAINT"
  | "SIGNAL_CHAIN"    | "RHYTHM_PULSE"   | "STAR_CONNECT"   | "PRECISION_STOP"
  | "CHAIN_REACTION"  | "MIRROR_PAINTER" | "WORD_HUNT"       | "NEON_TRAIL"
  | "FREQUENCY_MATCH" | "ICE_SLIDE"       | "SONAR_SWEEP"     | "AUCTION_BLITZ"
  | "LASER_GRID"      | "SEQUENCE_MEMORY" | "VAULT_CRACKER"   | "NEON_TYPERACE"
  | "ORBIT_SLINGSHOT" | "COLOR_FLOOD"     | "PULSE_CATCHER"  | "SHADOW_MATCH"
  | "WARP_SPEED"      | "MIND_THE_GAP"    | "PARTICLE_PAINTER" | "CHAIN_REACTION_PART_TWO"
  | "FREQUENCY_SURFER" | "HEIST_LASER"    | "BLACK_HOLE"   | "PIXEL_STORM" 
  | "PLASMA_SNAKE" | "MIND_MELD" | "NEON_PINBALL" | "TIME_FREEZE"
  | "ECHO_CHAMBER"  | "QUANTUM_COLLAPSE" ;


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
    case "LASER_GRID":      return <LaserGridGame       {...props} />;
    case "SEQUENCE_MEMORY": return <SequenceMemoryGame  {...props} />;
    case "VAULT_CRACKER":   return <VaultCrackerGame    {...props} />;
    case "NEON_TYPERACE":    return <NeonTyperaceGame    {...props} />;
    case "ORBIT_SLINGSHOT":  return <OrbitSlingshotGame  {...props} />;
    case "COLOR_FLOOD":      return <ColorFloodGame      {...props} />;
    case "PULSE_CATCHER":    return <PulseCatcherGame    {...props} />;
    case "SHADOW_MATCH":     return <ShadowMatchGame     {...props} />;
    case "WARP_SPEED":       return <WarpSpeedGame       {...props} />;
    case "MIND_THE_GAP":     return <MindTheGapGame      {...props} />;
    case "PARTICLE_PAINTER": return <ParticlePainterGame {...props} />;
    case "CHAIN_REACTION_PART_TWO": return <ChainReactionGamePartTwo {...props} />;
    case "FREQUENCY_SURFER": return <FrequencySurferGame {...props} />;
    case "HEIST_LASER":      return <HeistLaserGame      {...props} />;
    case "BLACK_HOLE":        return <BlackHoleGame        {...props} />;
    case "PIXEL_STORM":       return <PixelStormGame       {...props} />;
    case "PLASMA_SNAKE":      return <PlasmaSnakeGame      {...props} />;
    case "MIND_MELD":         return <MindMeldGame         {...props} />;
    case "NEON_PINBALL":      return <NeonPinballGame       {...props} />;
    case "TIME_FREEZE":       return <TimeFreezeGame        {...props} />;
    case "ECHO_CHAMBER":      return <EchoChamberGame       {...props} />;
    case "QUANTUM_COLLAPSE":  return <QuantumCollapseGame   {...props} />;
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
  LaserGridGame,    SequenceMemoryGame, VaultCrackerGame, 
  NeonTyperaceGame, OrbitSlingshotGame, ColorFloodGame, 
  PulseCatcherGame, ShadowMatchGame, WarpSpeedGame, MindTheGapGame,
  ParticlePainterGame, FrequencySurferGame, HeistLaserGame, ChainReactionGamePartTwo,
  BlackHoleGame, PixelStormGame, PlasmaSnakeGame, MindMeldGame,
};