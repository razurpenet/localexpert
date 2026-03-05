export default function SearchLoading() {
  return (
    <div className="space-y-6">
      <div className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-slate-200 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 animate-pulse rounded w-3/4" />
                <div className="h-3 bg-slate-200 animate-pulse rounded w-1/2" />
              </div>
            </div>
            <div className="h-3 bg-slate-200 animate-pulse rounded w-1/3" />
            <div className="h-px bg-slate-100" />
            <div className="h-3 bg-slate-200 animate-pulse rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
