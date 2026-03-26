// =============================================================================
// MULTIPLAYER EVENT COMPONENT
// components/game/MultiplayerEvent.tsx
// =============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Trophy, Clock, Zap, Crown, Loader2, X, Sword, Target } from "lucide-react";
import { useGame } from "./game-provider";


interface MultiplayerEvent {
  id: string;
  title: string;
  description: string;
  gameType: "TOKEN_RACE" | "CLICK_WARS" | "REACTION_TOURNAMENT" | "QUIZ_BATTLE";
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startsAt: string;
  endsAt: string;
  maxPlayers: number;
  currentPlayers: number;
  entryFee: number;
  prizePool: number;
  minPlayers: number;
  winnerReward: number;
  isRegistered?: boolean;
}

interface Participant {
  userId: string;
  displayName: string;
  score: number;
  rank: number;
  isCurrentUser: boolean;
}

export function MultiplayerEvent() {
  const [events, setEvents] = useState<MultiplayerEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MultiplayerEvent | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const { tokenBalance, awardTokens } = useGame();

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/game/multiplayer/events");
      const data = await res.json();
      setEvents(data.events);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDetails = async (eventId: string) => {
    try {
      const res = await fetch(`/api/game/multiplayer/events/${eventId}`);
      const data = await res.json();
      setParticipants(data.participants);
    } catch (error) {
      console.error("Failed to fetch event details:", error);
    }
  };

  const handleRegister = async (event: MultiplayerEvent) => {
    if (tokenBalance < event.entryFee) {
      alert(`Need ${event.entryFee} tokens to join this event`);
      return;
    }
    
    setRegistering(true);
    try {
      const res = await fetch(`/api/game/multiplayer/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await res.json();
      if (data.success) {
        setSelectedEvent(event);
        fetchEventDetails(event.id);
        fetchEvents();
      }
    } catch (error) {
      console.error("Failed to register:", error);
    } finally {
      setRegistering(false);
    }
  };

  const startGame = () => {
    setGameActive(true);
    setGameScore(0);
    setTimeLeft(30);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGameAction = () => {
    if (!gameActive) return;
    const points = Math.floor(Math.random() * 10) + 1;
    setGameScore(prev => prev + points);
    
    // Send score update to server
    fetch("/api/game/multiplayer/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: selectedEvent?.id, score: gameScore + points }),
    }).catch(console.error);
  };

  const endGame = async () => {
    setGameActive(false);
    
    const res = await fetch("/api/game/multiplayer/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: selectedEvent?.id, score: gameScore }),
    });
    
    const data = await res.json();
    if (data.reward) {
      awardTokens(data.reward, `Multiplayer Event: ${selectedEvent?.title}`);
    }
    
    fetchEventDetails(selectedEvent!.id);
    fetchEvents();
  };

  const getGameIcon = (type: string) => {
    switch (type) {
      case "TOKEN_RACE": return <Zap className="w-5 h-5" />;
      case "CLICK_WARS": return <Sword className="w-5 h-5" />;
      case "REACTION_TOURNAMENT": return <Target className="w-5 h-5" />;
      default: return <Trophy className="w-5 h-5" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "Ended";
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <>
      {/* Event List */}
      <div className="space-y-4">
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 border border-white/10"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  {getGameIcon(event.gameType)}
                </div>
                <div>
                  <h3 className="text-white font-bold">{event.title}</h3>
                  <p className="text-xs text-gray-400">{event.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-bold">{event.prizePool}</span>
                  <span className="text-xs text-gray-400">tokens</span>
                </div>
                {event.entryFee > 0 && (
                  <p className="text-xs text-gray-500">Entry: {event.entryFee} tokens</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{event.currentPlayers}/{event.maxPlayers}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{event.status === "ACTIVE" ? getTimeRemaining(event.endsAt) : formatTime(event.startsAt)}</span>
              </div>
            </div>
            
            <button
              onClick={() => handleRegister(event)}
              disabled={event.isRegistered || event.status !== "SCHEDULED" || event.currentPlayers >= event.maxPlayers}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                event.isRegistered
                  ? "bg-green-500/20 text-green-400 cursor-default"
                  : event.status !== "SCHEDULED"
                  ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                  : event.currentPlayers >= event.maxPlayers
                  ? "bg-red-500/20 text-red-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
              }`}
            >
              {event.isRegistered ? "✓ Registered" : event.status !== "SCHEDULED" ? "Event in Progress" : `Join (${event.entryFee} tokens)`}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getGameIcon(selectedEvent.gameType)}
                  <h2 className="text-white font-bold text-xl">{selectedEvent.title}</h2>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                {!gameActive ? (
                  <>
                    <div className="mb-6">
                      <p className="text-gray-300 mb-4">{selectedEvent.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-gray-400">Prize Pool</p>
                          <p className="text-2xl font-bold text-yellow-400">{selectedEvent.prizePool} tokens</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-gray-400">Players</p>
                          <p className="text-2xl font-bold text-white">{selectedEvent.currentPlayers}/{selectedEvent.maxPlayers}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Leaderboard */}
                    {participants.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Crown className="w-4 h-4 text-yellow-400" />
                          Participants
                        </h3>
                        <div className="space-y-2">
                          {participants.slice(0, 10).map((p) => (
                            <div key={p.userId} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-gray-400 w-6">#{p.rank}</span>
                                <span className={`text-sm ${p.isCurrentUser ? "text-purple-400 font-bold" : "text-white"}`}>
                                  {p.displayName}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-yellow-400">{p.score} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={startGame}
                      disabled={selectedEvent.status !== "ACTIVE"}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {selectedEvent.status === "ACTIVE" ? "Start Game" : "Waiting for event to start..."}
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="text-6xl font-bold text-white mb-2">{timeLeft}s</div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                          style={{ width: `${(timeLeft / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="mb-8">
                      <p className="text-5xl font-bold text-yellow-400">{gameScore}</p>
                      <p className="text-gray-400 mt-1">Your Score</p>
                    </div>
                    
                    <button
                      onClick={handleGameAction}
                      className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl font-bold hover:scale-105 transition-transform active:scale-95 shadow-2xl"
                    >
                      {selectedEvent.gameType === "TOKEN_RACE" ? "💰" : "⚡"}
                    </button>
                    
                    <p className="text-gray-400 text-sm mt-6">Tap as fast as you can!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}