"use client";

import { useState, useMemo } from "react";
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Film, X, Clock } from "lucide-react";
import { useCalendar, useVideos } from "./use-youtube";



const STATUS_COLOR: Record<string, string> = {
  PUBLISHED:  "bg-green-500/20 text-green-300 border-green-500/20",
  SCHEDULED:  "bg-blue-500/20 text-blue-300 border-blue-500/20",
  READY:      "bg-purple-500/20 text-purple-300 border-purple-500/20",
  FILMING:    "bg-yellow-500/20 text-yellow-300 border-yellow-500/20",
  EDITING:    "bg-orange-500/20 text-orange-300 border-orange-500/20",
  DRAFT:      "bg-white/5 text-white/30 border-white/5",
};

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function YoutubeContentCalendar({ userId }: { userId: string }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [scheduling, setScheduling] = useState(false);

  // Date range for current month view
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd   = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

  const { entries, loading, schedule, refetch } = useCalendar(userId, monthStart, monthEnd);
  const { videos: readyVideos } = useVideos(userId, { status: "READY" });

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    const start = new Date(monthStart);
    // Adjust to Monday start
    const dayOfWeek = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dayOfWeek);

    for (let i = 0; i < 35; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push({ date, isCurrentMonth: date.getMonth() === viewDate.getMonth() });
    }
    return days;
  }, [viewDate]);

  const getEntriesForDate = (date: Date) => {
    return entries.filter(e => {
      const d = new Date(e.scheduledDate);
      return d.getFullYear() === date.getFullYear() &&
             d.getMonth() === date.getMonth() &&
             d.getDate() === date.getDate();
    });
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowScheduleModal(true);
  };

  const handleSchedule = async () => {
    if (!selectedDate) return;
    setScheduling(true);
    await schedule({
      videoId: selectedVideoId || undefined,
      title: selectedVideoId
        ? readyVideos.find(v => v.id === selectedVideoId)?.title || "Scheduled Video"
        : "Scheduled Video",
      scheduledDate: selectedDate,
      notes: scheduleNotes,
    });
    setShowScheduleModal(false);
    setSelectedVideoId("");
    setScheduleNotes("");
    setScheduling(false);
  };

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const monthLabel = viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Content Calendar</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {entries.length} scheduled this month
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-white min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setSelectedDate(new Date()); setShowScheduleModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold ml-2"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl bg-white/3 border border-white/5 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {DAYS.map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-white/30 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map(({ date, isCurrentMonth }, idx) => {
            const dayEntries = getEntriesForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div
                key={idx}
                onClick={() => handleDayClick(date)}
                className={`min-h-[90px] p-2 border-b border-r border-white/3 cursor-pointer transition-colors hover:bg-white/3
                  ${!isCurrentMonth ? "opacity-30" : ""}
                  ${idx % 7 === 6 ? "border-r-0" : ""}
                  ${idx >= 28 ? "border-b-0" : ""}`}
              >
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1
                  ${isToday ? "bg-red-500 text-white" : "text-white/40"}`}>
                  {date.getDate()}
                </span>
                <div className="space-y-1">
                  {dayEntries.slice(0, 2).map(entry => (
                    <div
                      key={entry.id}
                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded border truncate
                        ${STATUS_COLOR[entry.status] || STATUS_COLOR.DRAFT}`}
                    >
                      {entry.title}
                    </div>
                  ))}
                  {dayEntries.length > 2 && (
                    <div className="text-[9px] text-white/30">+{dayEntries.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Schedule */}
      <div className="rounded-xl bg-white/3 border border-white/5 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Upcoming</h3>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-xs text-white/30">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <CalendarDays className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-sm text-white/30">No videos scheduled this month</p>
            <p className="text-xs text-white/20 mt-1">Click any day to schedule a video</p>
          </div>
        ) : (
          entries
            .filter(e => new Date(e.scheduledDate) >= new Date())
            .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
            .slice(0, 5)
            .map(entry => (
              <div key={entry.id} className="flex items-center gap-3 px-5 py-3 border-b border-white/3 hover:bg-white/2 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Film className="w-3.5 h-3.5 text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{entry.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-white/25" />
                    <p className="text-xs text-white/30">
                      {new Date(entry.scheduledDate).toLocaleDateString("en-GB", {
                        weekday: "short", day: "numeric", month: "short"
                      })}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[entry.status] || STATUS_COLOR.DRAFT}`}>
                  {entry.status}
                </span>
              </div>
            ))
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0d0d14] border border-white/10 rounded-2xl p-6 mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white">
                Schedule Video — {selectedDate?.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-white/30 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                  Select Video (optional)
                </label>
                <select
                  value={selectedVideoId}
                  onChange={e => setSelectedVideoId(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20"
                >
                  <option value="">— No video (placeholder) —</option>
                  {readyVideos.map(v => (
                    <option key={v.id} value={v.id}>{v.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">Notes</label>
                <input
                  value={scheduleNotes}
                  onChange={e => setScheduleNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                disabled={scheduling}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {scheduling ? "Scheduling..." : "Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}