// app/admin/[userId]/companies/[companySlug]/invoices/error.tsx
"use client";

export default function InvoicesError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center">
        <p className="text-sm text-red-600 mb-3">Failed to load invoices</p>
        <button
          onClick={reset}
          className="text-xs font-semibold text-stone-600 border border-stone-200 px-3 py-1.5 rounded-sm hover:border-amber-400"
        >
          Try again
        </button>
      </div>
    </div>
  );
}