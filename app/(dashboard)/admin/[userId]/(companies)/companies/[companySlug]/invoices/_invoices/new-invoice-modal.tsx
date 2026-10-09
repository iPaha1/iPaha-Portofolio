// app/admin/[userId]/companies/[companySlug]/invoices/_components/new-invoice-modal.tsx
"use client";

import React, { useState } from "react";
import {
  X, Plus, Trash2, Send, Save, DollarSign, Calendar,
  User, Mail, Building2, FileText, AlertCircle, Loader2,
  CheckCircle, Eye, Printer, Download,
} from "lucide-react";
import { createInvoice, sendInvoiceEmail, updateInvoiceStatus } from "@/lib/actions/invoice-actions";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Props {
  companyId: string;
  companySlug: string;
  accentColor: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TAX_RATES = [
  { value: 0, label: "0% (No VAT)" },
  { value: 20, label: "20% (Standard VAT)" },
  { value: 5, label: "5% (Reduced VAT)" },
  { value: 0, label: "0% (Zero-rated)" },
];

export function NewInvoiceModal({ companyId, companySlug, accentColor, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    taxRate: 20,
    notes: "",
    currency: "GBP",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0 },
  ]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (formData.taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent, action: "save" | "send") => {
    e.preventDefault();
    
    // Validation
    if (!formData.clientName.trim()) {
      setError("Client name is required");
      return;
    }
    if (!formData.clientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      setError("Valid client email is required");
      return;
    }
    if (lineItems.length === 0 || lineItems.every(item => !item.description)) {
      setError("At least one line item is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const invoice = await createInvoice({
        companyId,
        companySlug,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientCompany: formData.clientCompany || undefined,
        invoiceNumber: formData.invoiceNumber,
        issueDate: new Date(formData.issueDate),  // This maps to issuedAt in the action
        dueDate: new Date(formData.dueDate),       // This maps to dueAt in the action
        lineItems: lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
        })),
        subtotal: calculateSubtotal(),
        taxRate: formData.taxRate,
        taxAmount: calculateTax(),
        total: calculateTotal(),
        notes: formData.notes || undefined,
        currency: formData.currency,
        });

      setCreatedInvoiceId(invoice.id);

      if (action === "send") {
        await sendInvoiceEmail(invoice.id, companySlug);
        await updateInvoiceStatus(invoice.id, "SENT", companySlug);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
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
          <h3 className="text-xl font-bold text-stone-800 mb-2">Invoice Created!</h3>
          <p className="text-stone-500 mb-4">
            Invoice {formData.invoiceNumber} has been created successfully.
          </p>
          <div className="bg-stone-50 rounded-sm p-3 mb-6 text-left">
            <p className="text-xs text-stone-600">What would you like to do next?</p>
            <div className="mt-2 space-y-1">
              <button className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
                <Eye className="w-3 h-3" /> View Invoice
              </button>
              <button className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
                <Printer className="w-3 h-3" /> Print Invoice
              </button>
              <button className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
                <Download className="w-3 h-3" /> Download PDF
              </button>
            </div>
          </div>
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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Create New Invoice</h2>
            <p className="text-sm text-stone-400 mt-0.5">Generate professional invoice for services rendered</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-sm p-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Invoice Header */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 font-mono"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
              >
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Client Information */}
          <div className="border-t border-stone-100 pt-4">
            <h3 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Client Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">
                  Client Name *
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
                  Client Email *
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
              <div className="col-span-2">
                <label className="text-xs font-semibold text-stone-600 block mb-1">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  value={formData.clientCompany}
                  onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
                  placeholder="Company name"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="border-t border-stone-100 pt-4">
            <h3 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Dates
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">
                  Issue Date *
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="border-t border-stone-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Line Items
              </h3>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                <Plus className="w-3 h-3" />
                Add Item
              </button>
            </div>
            
            <div className="space-y-2">
              {lineItems.map((item, index) => (
                <div key={item.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                      placeholder="Item description"
                      className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                      min="1"
                      step="1"
                      className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 text-center"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 text-right"
                    />
                  </div>
                  <div className="w-24 text-right text-sm font-semibold text-stone-700 pt-2">
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: formData.currency }).format(item.quantity * item.unitPrice)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    disabled={lineItems.length === 1}
                    className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Totals */}
          <div className="border-t border-stone-100 pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Subtotal:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: formData.currency }).format(calculateSubtotal())}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-stone-600">Tax Rate:</span>
                  <select
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                    className="w-24 px-2 py-1 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
                  >
                    {TAX_RATES.map(rate => (
                      <option key={rate.value} value={rate.value}>{rate.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Tax Amount:</span>
                  <span>
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: formData.currency }).format(calculateTax())}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-stone-200">
                  <span>Total:</span>
                  <span style={{ color: accentColor }}>
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: formData.currency }).format(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-stone-100 pt-4">
            <label className="text-xs font-semibold text-stone-600 block mb-1">
              Notes / Payment Instructions
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 resize-none"
              placeholder="Payment terms, bank details, or any additional notes..."
            />
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
              type="button"
              onClick={(e) => handleSubmit(e, "save")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-stone-700 border border-stone-300 rounded-sm hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save as Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "send")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-sm transition-colors disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Create & Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}