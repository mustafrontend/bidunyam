"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api";
import { MessageCircle, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp } from "lucide-react";

type RequestStatus = "OPEN" | "ANSWERED" | "CLOSED";

interface SupportRequest {
  _id: string;
  subject: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
  answer?: string;
  answeredAt?: string;
  productName?: string;
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  OPEN: { label: "Açık", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  ANSWERED: { label: "Yanıtlandı", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
  CLOSED: { label: "Kapatıldı", color: "text-slate-500", bg: "bg-slate-50 border-slate-200", icon: XCircle },
};

function RequestSkeleton() {
  return (
    <div className="border border-slate-100 rounded-2xl p-5 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-40 bg-slate-100 rounded" />
        <div className="h-6 w-20 bg-slate-100 rounded-full" />
      </div>
      <div className="h-10 bg-slate-100 rounded" />
    </div>
  );
}

export default function RequestsPage() {
  const token = useAuthStore((s) => s.token);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New request form
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiClient.get("/support/my-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data?.requests || res.data?.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleSubmit = useCallback(async () => {
    if (!subject.trim() || !message.trim()) {
      setSubmitError("Konu ve mesaj boş bırakılamaz.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await apiClient.post(
        "/support/requests",
        { subject: subject.trim(), message: message.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitSuccess(true);
      setSubject("");
      setMessage("");
      setShowForm(false);
      await fetchRequests();
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Talep gönderilemedi.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [subject, message, token, fetchRequests]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Soru ve Taleplerim</h1>
          <p className="mt-1 text-slate-400 text-sm font-medium">Müşteri hizmetleriyle yazışmalarınızı yönetin.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-black hover:bg-[#ff5000] active:scale-95 transition-all shrink-0"
        >
          + Yeni Talep
        </button>
      </div>

      {/* New Request Form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Yeni Talep Oluştur</h2>
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">Konu</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Talebinizin konusunu yazın"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">Mesaj</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Talebinizi detaylıca açıklayın..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white"
            />
          </div>
          {submitError && (
            <p className="text-sm font-bold text-red-500">{submitError}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-[#ff5000] transition-colors disabled:opacity-50"
            >
              {submitting ? "Gönderiliyor..." : "Gönder"}
            </button>
            <button
              onClick={() => { setShowForm(false); setSubject(""); setMessage(""); setSubmitError(""); }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-white transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 size={15} />
          Talebiniz başarıyla gönderildi. En kısa sürede yanıt verilecektir.
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <RequestSkeleton key={i} />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-8 py-16 text-center">
          <MessageCircle size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-800 font-black mb-1">Henüz bir talebiniz yok</p>
          <p className="text-slate-400 text-sm font-medium">Müşteri hizmetleriyle iletişime geçmek için yeni talep oluşturun.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.OPEN;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === req._id;
            return (
              <div key={req._id} className="border border-slate-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req._id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-black text-slate-900 truncate">{req.subject}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {new Date(req.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-black ${cfg.bg} ${cfg.color}`}>
                      <StatusIcon size={11} />
                      {cfg.label}
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Mesajınız</p>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">{req.message}</p>
                    </div>
                    {req.answer && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Müşteri Hizmetleri Yanıtı</p>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{req.answer}</p>
                        {req.answeredAt && (
                          <p className="text-xs text-slate-400 font-medium mt-2">
                            {new Date(req.answeredAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
