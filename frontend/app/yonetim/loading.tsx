"use client";

export default function YonetimLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white border border-slate-100" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-white border border-slate-100" />
        ))}
      </div>
    </div>
  );
}
