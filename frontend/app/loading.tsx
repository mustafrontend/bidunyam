"use client";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header skeleton */}
        <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200" />
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="aspect-square animate-pulse bg-slate-100" />
              <div className="space-y-2 p-4">
                <div className="h-2 w-1/4 animate-pulse rounded bg-slate-100" />
                <div className="h-3 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
                <div className="mt-4 flex items-center justify-between">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                  <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
