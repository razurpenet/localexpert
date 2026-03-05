export default function ProviderLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="bg-white rounded-2xl border border-border p-6 flex gap-6">
          <div className="h-24 w-24 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-6 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-200 rounded w-2/3" />
          </div>
        </div>
        <div className="h-40 bg-white rounded-2xl border border-border" />
        <div className="h-64 bg-white rounded-2xl border border-border" />
      </div>
    </div>
  )
}
