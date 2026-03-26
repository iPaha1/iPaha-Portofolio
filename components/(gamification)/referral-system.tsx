// =============================================================================
// REFERRAL SYSTEM COMPONENT
// components/game/ReferralSystem.tsx
// =============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Share2, Users, Gift, Star, Link as LinkIcon, Twitter, Linkedin, Mail } from "lucide-react";
import { useGame } from "./game-provider";


interface ReferralData {
  code: string;
  referralLink: string;
  totalReferrals: number;
  totalEarned: number;
  pendingRewards: number;
  referrals: Array<{
    id: string;
    email: string;
    status: string;
    rewardGiven: boolean;
    completedAt: string | null;
  }>;
}

export function ReferralSystem() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { tokenBalance } = useGame();

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const res = await fetch("/api/game/referrals");
      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error("Failed to fetch referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    const text = `Earn tokens with me on @iPaha3! Use my referral link: ${data?.referralLink}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareOnLinkedIn = () => {
    const text = `Check out this amazing platform! Earn tokens with my referral: ${data?.referralLink}`;
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(data?.referralLink || "")}&title=${encodeURIComponent(text)}`, "_blank");
  };

  const shareViaEmail = () => {
    window.location.href = `mailto:?subject=Join me on this platform&body=${encodeURIComponent(`Hey! Check this out and earn tokens: ${data?.referralLink}`)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-center">
          <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{data?.totalReferrals || 0}</p>
          <p className="text-xs text-gray-400">Total Referrals</p>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-center">
          <Gift className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{data?.totalEarned || 0}</p>
          <p className="text-xs text-gray-400">Tokens Earned</p>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-center">
          <Star className="w-6 h-6 text-pink-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{data?.pendingRewards || 0}</p>
          <p className="text-xs text-gray-400">Pending Rewards</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-5 border border-purple-500/30">
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
          <LinkIcon className="w-4 h-4" />
          Your Referral Link
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={data?.referralLink || ""}
            readOnly
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
          />
          <button
            onClick={() => copyToClipboard(data?.referralLink || "")}
            className="p-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Share this link with friends. When they sign up, you both earn tokens!
        </p>
      </div>

      {/* Share Buttons */}
      <div>
        <h3 className="text-white font-semibold mb-3">Share on Social</h3>
        <div className="flex gap-3">
          <button
            onClick={shareOnTwitter}
            className="flex-1 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Twitter className="w-4 h-4" /> Twitter
          </button>
          <button
            onClick={shareOnLinkedIn}
            className="flex-1 bg-[#0077B5] hover:bg-[#00669c] text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Linkedin className="w-4 h-4" /> LinkedIn
          </button>
          <button
            onClick={shareViaEmail}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Mail className="w-4 h-4" /> Email
          </button>
        </div>
      </div>

      {/* Referral History */}
      {data?.referrals && data.referrals.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3">Your Referrals</h3>
          <div className="space-y-2">
            {data.referrals.map((ref) => (
              <div key={ref.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">{ref.email}</p>
                  <p className="text-xs text-gray-500">
                    {ref.completedAt ? new Date(ref.completedAt).toLocaleDateString() : "Pending"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {ref.rewardGiven ? (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Rewarded
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-400">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <p className="text-xs text-purple-300">
          <span className="font-bold">How it works:</span> Share your unique link. When someone signs up and completes their first game, you both earn <span className="font-bold">50 tokens</span>. The more friends you invite, the more tokens you earn!
        </p>
      </div>
    </div>
  );
}