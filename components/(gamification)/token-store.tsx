// =============================================================================
// TOKEN STORE COMPONENT
// components/game/TokenStore.tsx
// =============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Star, Sparkles, Gift, Lock, Unlock, Check, Loader2, X, Zap } from "lucide-react";
import { useGame } from "./game-provider";


interface StoreItem {
  id: string;
  name: string;
  description: string;
  type: "TOOL_ACCESS" | "FEATURE_UNLOCK" | "CUSTOM_THEME" | "BADGE" | "BOOSTER" | "MYSTERY_BOX";
  tokenCost: number;
  stock: number | null;
  imageUrl: string | null;
  metadata: any;
}

export function TokenStore() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const { tokenBalance } = useGame();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/game/store");
      const data = await res.json();
      setItems(data.items);
    } catch (error) {
      console.error("Failed to fetch store items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (item: StoreItem) => {
    if (tokenBalance < item.tokenCost) {
      alert(`Need ${item.tokenCost} tokens to redeem this item`);
      return;
    }
    
    setRedeeming(item.id);
    try {
      const res = await fetch("/api/game/store/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      
      const data = await res.json();
      if (data.success) {
        setShowSuccess(item.id);
        setTimeout(() => setShowSuccess(null), 3000);
        fetchItems();
      } else {
        alert(data.error || "Failed to redeem item");
      }
    } catch (error) {
      console.error("Failed to redeem:", error);
    } finally {
      setRedeeming(null);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "TOOL_ACCESS": return <Unlock className="w-5 h-5" />;
      case "FEATURE_UNLOCK": return <Sparkles className="w-5 h-5" />;
      case "CUSTOM_THEME": return <Star className="w-5 h-5" />;
      case "BADGE": return <Gift className="w-5 h-5" />;
      case "BOOSTER": return <Zap className="w-5 h-5" />;
      default: return <Gift className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance Display */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-center">
        <p className="text-white/80 text-sm mb-1">Your Balance</p>
        <p className="text-3xl font-bold text-white">{tokenBalance.toLocaleString()} tokens</p>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                {getItemIcon(item.type)}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold">{item.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-bold">{item.tokenCost}</span>
                    <span className="text-xs text-gray-400">tokens</span>
                  </div>
                  {item.stock !== null && (
                    <span className="text-xs text-gray-500">{item.stock} left</span>
                  )}
                </div>
                <button
                  onClick={() => handleRedeem(item)}
                  disabled={redeeming === item.id || tokenBalance < item.tokenCost}
                  className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-all ${
                    tokenBalance >= item.tokenCost
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
                      : "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {redeeming === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Redeem"
                  )}
                </button>
              </div>
            </div>
            
            {/* Success Toast */}
            <AnimatePresence>
              {showSuccess === item.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Redeemed!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}