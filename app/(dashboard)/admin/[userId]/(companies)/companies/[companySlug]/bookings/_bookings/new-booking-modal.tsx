// app/admin/[userId]/companies/[companySlug]/bookings/_components/new-booking-modal.tsx
"use client";

import React, { useState } from "react";
import {
  X, User, Mail, Phone, Building2, Calendar as CalendarIcon,
  Clock, MessageSquare, Video, MapPin, Briefcase, Send,
  CheckCircle, AlertCircle, Loader2,
} from "lucide-react";
import { createManualBooking } from "@/lib/actions/booking-actions";

interface Props {
  companyId: string;
  companySlug: string;
  accentColor: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SERVICE_TYPES = [
  { value: "consultation", label: "Initial Consultation", duration: 30 },
  { value: "discovery", label: "Discovery Workshop", duration: 60 },
  { value: "follow_up", label: "Follow-up Meeting", duration: 30 },
  { value: "technical_review", label: "Technical Review", duration: 90 },
  { value: "training", label: "Training Session", duration: 120 },
];

const LOCATION_TYPES = [
  { value: "VIDEO_CALL", label: "Video Call", icon: Video },
  { value: "IN_PERSON", label: "In Person", icon: MapPin },
  { value: "PHONE", label: "Phone Call", icon: Phone },
];

const SOURCE_TYPES = [
  { value: "walk_in", label: "Walk-in Client" },
  { value: "site_visit", label: "Site Visit" },
  { value: "referral", label: "Referral" },
  { value: "phone_call", label: "Phone Call" },
  { value: "email", label: "Email" },
  { value: "event", label: "Networking Event" },
  { value: "existing_client", label: "Existing Client" },
];

export function NewBookingModal({ companyId, companySlug, accentColor, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCompany: "",
    serviceType: "consultation",
    location: "VIDEO_CALL",
    preferredDate: "",
    preferredTime: "",
    notes: "",
    source: "walk_in",
    sendNotification: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.clientName.trim()) {
      setError("Client name is required");
      return;
    }
    if (!formData.clientEmail.trim()) {
      setError("Email address is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Combine date and time if provided
      let preferredDateTime = null;
      if (formData.preferredDate && formData.preferredTime) {
        preferredDateTime = new Date(`${formData.preferredDate}T${formData.preferredTime}`);
      }

      await createManualBooking({
        companyId,
        companySlug,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone || undefined,
        clientCompany: formData.clientCompany || undefined,
        clientMessage: formData.notes || undefined,
        serviceType: formData.serviceType,
        location: formData.location as any,
        preferredDate: preferredDateTime,
        source: formData.source,
        status: "PENDING",
        sendEmail: formData.sendNotification,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-stone-800 mb-2">Booking Created!</h3>
          <p className="text-stone-500 mb-6">
            The booking has been created successfully.
            {formData.sendNotification && " An email notification has been sent to the client."}
          </p>
          <button
            onClick={() => onClose()}
            className="w-full py-2.5 rounded-sm font-semibold text-white"
            style={{ backgroundColor: accentColor }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Create New Booking</h2>
            <p className="text-sm text-stone-400 mt-0.5">Manually add a booking for a client</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-sm p-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Client Information Section */}
          <div>
            <h3 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Client Information
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
                    placeholder="+44 7700 000000"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    Company/Business
                  </label>
                  <input
                    type="text"
                    value={formData.clientCompany}
                    onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
                    placeholder="Business name"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details Section */}
          <div className="border-t border-stone-100 pt-4">
            <h3 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Booking Details
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    Service Type
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
                  >
                    {SERVICE_TYPES.map(service => (
                      <option key={service.value} value={service.value}>
                        {service.label} ({service.duration} min)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    Location Type
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
                  >
                    {LOCATION_TYPES.map(loc => {
                      const Icon = loc.icon;
                      return (
                        <option key={loc.value} value={loc.value}>
                          {loc.label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    Preferred Time
                  </label>
                  <input
                    type="time"
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="border-t border-stone-100 pt-4">
            <h3 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Additional Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">
                  Source / How did this lead come in?
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
                >
                  {SOURCE_TYPES.map(source => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">
                  Notes / Requirements
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 resize-none"
                  placeholder="Any specific requirements or notes about this client..."
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="border-t border-stone-100 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sendNotification}
                onChange={(e) => setFormData({ ...formData, sendNotification: e.target.checked })}
                className="w-4 h-4 rounded-sm accent-amber-500"
              />
              <span className="text-sm text-stone-700">
                Send email notification to client
              </span>
            </label>
            <p className="text-xs text-stone-400 mt-1 ml-6">
              The client will receive a confirmation email with booking details.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-stone-600 border border-stone-200 rounded-sm hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-sm transition-colors disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Create Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}