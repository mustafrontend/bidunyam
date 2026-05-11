"use client";

import { XMLUploadComponent } from "@/components/admin/XMLUploadComponent";

export default function XMLUploadPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8">
        <XMLUploadComponent />
      </div>
    </div>
  );
}
