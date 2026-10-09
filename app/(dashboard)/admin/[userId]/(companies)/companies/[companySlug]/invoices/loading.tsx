// app/admin/[userId]/companies/[companySlug]/invoices/loading.tsx
export default function InvoicesLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-stone-400">Loading invoices...</p>
      </div>
    </div>
  );
}