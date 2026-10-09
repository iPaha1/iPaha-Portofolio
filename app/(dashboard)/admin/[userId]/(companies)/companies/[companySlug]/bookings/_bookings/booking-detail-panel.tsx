// app/admin/[userId]/companies/[companySlug]/bookings/_components/booking-detail-panel.tsx
"use client";

import React, { useState } from "react";
import {
  XCircle, Send, Calendar, Video, MessageSquare, Clock,
  CheckCircle, XCircle as XIcon, AlertCircle, Mail,
  Phone, Building2, User, ExternalLink, Save,
} from "lucide-react";
import { updateBookingStatus, addBookingNote, sendFollowUpEmail } from "@/lib/actions/booking-actions";

interface Booking {
  id: string; clientName: string; clientEmail: string;
  clientPhone: string | null; clientCompany: string | null;
  clientMessage: string | null; serviceType: string | null;
  preferredDate: Date | null; confirmedDate: Date | null;
  status: string; location: string; meetingUrl: string | null;
  source: string | null; internalNotes: string | null;
  createdAt: Date; updatedAt: Date;
}

interface Props {
  booking: Booking;
  onClose: () => void;
  onUpdate: () => void;
  accent: string;
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", color: "#d97706" },
  { value: "CONFIRMED", label: "Confirmed", color: "#059669" },
  { value: "COMPLETED", label: "Completed", color: "#2563eb" },
  { value: "CANCELLED", label: "Cancelled", color: "#6b7280" },
  { value: "NO_SHOW", label: "No-show", color: "#dc2626" },
];

export function BookingDetailPanel({ booking, onClose, onUpdate, accent }: Props) {
  const [status, setStatus] = useState(booking.status);
  const [confirmedDate, setConfirmedDate] = useState(
    booking.confirmedDate ? new Date(booking.confirmedDate).toISOString().slice(0, 16) : ""
  );
  const [meetingUrl, setMeetingUrl] = useState(booking.meetingUrl || "");
  const [note, setNote] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "email">("details");

  async function handleUpdateStatus() {
    setLoading(true);
    try {
      await updateBookingStatus(booking.id, status as any, {
        confirmedDate: confirmedDate ? new Date(confirmedDate) : undefined,
        meetingUrl: meetingUrl || undefined,
        sendEmail: status === "CONFIRMED" || status === "CANCELLED",
      });
      onUpdate();
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote() {
    if (!note.trim()) return;
    setLoading(true);
    try {
      await addBookingNote(booking.id, note);
      setNote("");
      onUpdate();
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendEmail() {
    if (!emailSubject || !emailMessage) return;
    setLoading(true);
    try {
      await sendFollowUpEmail(booking.id, emailSubject, emailMessage);
      setEmailSubject("");
      setEmailMessage("");
      setActiveTab("details");
      onUpdate();
    } catch (error) {
      console.error("Failed to send email:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-96 flex-shrink-0 bg-white border-l border-stone-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 flex-shrink-0">
        <p className="text-sm font-black text-stone-900">Booking Details</p>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-sm">
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-100 flex-shrink-0">
        {[
          { id: "details", label: "Details", icon: User },
          { id: "notes", label: "Notes", icon: MessageSquare },
          { id: "email", label: "Email", icon: Mail },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "border-b-2 text-stone-900"
                  : "text-stone-400 hover:text-stone-600 border-b-2 border-transparent"
              }`}
              style={activeTab === tab.id ? { borderBottomColor: accent, color: accent } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "details" && (
          <>
            {/* Client Info */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Client</p>
              <div className="bg-stone-50 rounded-sm p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-sm font-medium">{booking.clientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <a href={`mailto:${booking.clientEmail}`} className="text-sm text-amber-600 hover:underline">
                    {booking.clientEmail}
                  </a>
                </div>
                {booking.clientPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <a href={`tel:${booking.clientPhone}`} className="text-sm text-amber-600 hover:underline">
                      {booking.clientPhone}
                    </a>
                  </div>
                )}
                {booking.clientCompany && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-sm">{booking.clientCompany}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Update */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Status</p>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Scheduling */}
            {(status === "CONFIRMED" || booking.status === "CONFIRMED") && (
              <>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Confirmed Date & Time</p>
                  <input
                    type="datetime-local"
                    value={confirmedDate}
                    onChange={(e) => setConfirmedDate(e.target.value)}
                    className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Meeting Link</p>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </>
            )}

            {/* Message */}
            {booking.clientMessage && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Client Message</p>
                <div className="bg-amber-50 border border-amber-100 rounded-sm p-3">
                  <p className="text-sm whitespace-pre-wrap">{booking.clientMessage}</p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleUpdateStatus}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-2.5 rounded-sm transition-colors disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? "Updating..." : "Update Booking"}
            </button>
          </>
        )}

        {activeTab === "notes" && (
          <>
            {/* Existing Notes */}
            {booking.internalNotes && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Previous Notes</p>
                <div className="bg-stone-50 rounded-sm p-3 border border-stone-100">
                  <p className="text-sm whitespace-pre-wrap font-mono text-xs">{booking.internalNotes}</p>
                </div>
              </div>
            )}

            {/* Add Note */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Add Internal Note</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Add internal notes about this booking..."
                className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 resize-none"
              />
              <button
                onClick={handleAddNote}
                disabled={loading || !note.trim()}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-2 rounded-sm transition-colors disabled:opacity-50"
                style={{ backgroundColor: accent }}
              >
                {loading ? <Clock className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                Add Note
              </button>
            </div>
          </>
        )}

        {activeTab === "email" && (
          <>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Subject</p>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Follow-up about your consultation"
                className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Message</p>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={8}
                placeholder="Dear client, ..."
                className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
            <button
              onClick={handleSendEmail}
              disabled={loading || !emailSubject || !emailMessage}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-2.5 rounded-sm transition-colors disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Email
            </button>
          </>
        )}
      </div>
    </div>
  );
}