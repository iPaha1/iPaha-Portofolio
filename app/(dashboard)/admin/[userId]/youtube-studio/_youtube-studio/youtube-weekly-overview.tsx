"use client";


import {
  TrendingUp, Eye, Users, Clock, Wand2, Film,
  Lightbulb, ArrowRight, Zap, Target, Calendar, Star
} from "lucide-react";
import { YoutubeTab } from "./types";

interface Props {
  userId: string;
  onNavigate: (tab: YoutubeTab) => void;
}

const MOCK_STATS = [
  { label: "Total Videos",       value: "24",     change: "+3 this week",  icon: Film,      color: "from-red-500/20 to-red-500/5",     iconColor: "text-red-400"    },
  { label: "Channel Views",      value: "12.4K",  change: "+18% this month", icon: Eye,     color: "from-blue-500/20 to-blue-500/5",   iconColor: "text-blue-400"   },
  { label: "Subscribers",        value: "847",    change: "+62 this week", icon: Users,     color: "from-green-500/20 to-green-500/5", iconColor: "text-green-400"  },
  { label: "Watch Hours",        value: "342h",   change: "+24h this week", icon: Clock,    color: "from-orange-500/20 to-orange-500/5", iconColor: "text-orange-400"},
];

const RECENT_VIDEOS = [
  { title: "Nobody Is Coming To Save You", status: "Published", views: 1420, date: "3 days ago",   score: 94 },
  { title: "The Cost of Waiting to Be Ready", status: "Published", views: 892, date: "10 days ago", score: 88 },
  { title: "Why Most People Never Start", status: "Ready",   views: 0,    date: "Scheduled in 2d", score: 91 },
  { title: "The Identity Trap",             status: "Draft",    views: 0,    date: "In progress",   score: null },
];

const QUICK_ACTIONS = [
  { label: "Generate This Week's Content", icon: Wand2, tab: "generator" as YoutubeTab, color: "from-red-500 to-orange-500", desc: "AI writes 3 full scripts" },
  { label: "Browse Ideas Bank",            icon: Lightbulb, tab: "ideas" as YoutubeTab, color: "from-blue-500 to-cyan-500", desc: "47 ideas waiting" },
  { label: "View Content Calendar",        icon: Calendar,  tab: "calendar" as YoutubeTab, color: "from-purple-500 to-pink-500", desc: "Plan next 4 weeks" },
];

export default function YoutubeStudioOverview({ userId, onNavigate }: Props) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-red-500/20 via-orange-500/10 to-transparent border border-red-500/20 p-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(239,68,68,0.15),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Content Creation Studio</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Good morning, Isaac.</h2>
          <p className="text-white/50 text-sm max-w-lg">
            Your channel is growing. Week 14's content is ready to generate. 
            <span className="text-white/70"> 3 videos will build on your "self-belief" arc from last week.</span>
          </p>
          <button
            onClick={() => onNavigate("generator")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Wand2 className="w-4 h-4" />
            Generate Week 14 Content
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-xl bg-gradient-to-br ${stat.color} border border-white/5 p-4`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/40 font-medium">{stat.label}</span>
                <Icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/40 mt-1">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent Videos */}
        <div className="lg:col-span-2 rounded-xl bg-white/3 border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Recent Videos</h3>
            <button onClick={() => onNavigate("library")} className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {RECENT_VIDEOS.map((video) => (
              <div key={video.title} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/2 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Film className="w-3.5 h-3.5 text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{video.title}</p>
                  <p className="text-xs text-white/30 mt-0.5">{video.date}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {video.views > 0 && (
                    <div className="flex items-center gap-1 text-xs text-white/40">
                      <Eye className="w-3 h-3" />
                      {video.views.toLocaleString()}
                    </div>
                  )}
                  {video.score && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-yellow-400 font-medium">{video.score}</span>
                    </div>
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                    ${video.status === "Published" ? "bg-green-500/15 text-green-400" :
                      video.status === "Ready"     ? "bg-blue-500/15 text-blue-400" :
                                                     "bg-white/5 text-white/30"}`}>
                    {video.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white px-1">Quick Actions</h3>
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => onNavigate(action.tab)}
                className="w-full rounded-xl bg-white/3 border border-white/5 p-4 hover:bg-white/5 hover:border-white/10 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{action.label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{action.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
              </button>
            );
          })}

          {/* Growth Goal */}
          <div className="rounded-xl bg-white/3 border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-semibold text-white">Goal: 1,000 Subscribers</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-[84.7%] bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-white/30">847 / 1,000</span>
              <span className="text-[10px] text-orange-400">84.7%</span>
            </div>
          </div>

          {/* Streak */}
          <div className="rounded-xl bg-gradient-to-br from-yellow-500/15 to-orange-500/5 border border-yellow-500/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-400/70 font-medium">Publishing Streak</p>
                <p className="text-2xl font-bold text-white mt-0.5">6 <span className="text-sm text-white/40 font-normal">weeks</span></p>
              </div>
              <div className="text-3xl">🔥</div>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Arc */}
      <div className="rounded-xl bg-white/3 border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Channel Narrative Arc</h3>
          <span className="ml-auto text-xs text-white/30">AI tracks your story progression</span>
        </div>
        <div className="flex items-start gap-0">
          {[
            { week: "Wk 11", topic: "Nobody Is Coming to Save You", status: "done" },
            { week: "Wk 12", topic: "The Identity Trap",             status: "done" },
            { week: "Wk 13", topic: "Confidence Without Arrogance",   status: "done" },
            { week: "Wk 14", topic: "What Most People Get Wrong Next", status: "current" },
            { week: "Wk 15", topic: "AI suggests next...",            status: "next" },
          ].map((node, i) => (
            <div key={node.week} className="flex-1 flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full z-10 shrink-0
                ${node.status === "done"    ? "bg-green-400" :
                  node.status === "current" ? "bg-red-400 ring-2 ring-red-400/30" :
                                              "bg-white/10 border border-dashed border-white/20"}`} />
              {i < 4 && <div className={`h-0.5 w-full -mt-1.5 ${node.status !== "next" ? "bg-white/10" : "bg-white/5 border-dashed"}`} />}
              <div className="mt-2 text-center px-1">
                <p className="text-[9px] text-white/30 uppercase font-bold">{node.week}</p>
                <p className={`text-[10px] leading-tight mt-0.5 ${node.status === "current" ? "text-white" : node.status === "next" ? "text-white/20 italic" : "text-white/40"}`}>
                  {node.topic}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}