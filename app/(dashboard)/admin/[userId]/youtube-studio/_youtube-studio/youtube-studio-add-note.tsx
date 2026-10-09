// app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-idea-note-modal.tsx

"use client";

import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { useUpdateIdeaNote } from "@/hooks/youtube-studio/use-youtube";

interface Props {
  userId: string;
  ideaId: string;
  currentNote?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function YoutubeIdeaNoteModal({ userId, ideaId, currentNote, onClose, onSaved }: Props) {
  const [note, setNote] = useState(currentNote || "");
  const { updateNote, loading } = useUpdateIdeaNote(userId);

  const handleSave = async () => {
    await updateNote(ideaId, note);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-lg w-full">
        <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Add Note</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
        
        <div className="p-5">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add your notes about this idea... What would you change? What specific angle to focus on? Any research needed?"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20"
            rows={6}
          />
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}