"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api";
import { Star, ShoppingBag, CheckCircle2, AlertCircle } from "lucide-react";

interface Review {
  _id: string;
  productName: string;
  productImageUrl: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface ReviewableProduct {
  orderId: string;
  productId: string;
  name: string;
  imageUrl: string;
  brand: string;
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`transition-transform ${onChange ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <Star
            size={22}
            fill={(hovered || value) >= star ? "currentColor" : "none"}
            className={(hovered || value) >= star ? "text-amber-400" : "text-slate-300"}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="border border-slate-100 rounded-2xl p-5 animate-pulse space-y-3">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-slate-100 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 bg-slate-100 rounded" />
          <div className="h-3 w-1/4 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="h-12 bg-slate-100 rounded" />
    </div>
  );
}

export default function ReviewsPage() {
  const token = useAuthStore((s) => s.token);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewable, setReviewable] = useState<ReviewableProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // New review form state
  const [activeReview, setActiveReview] = useState<ReviewableProduct | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  const fetchReviews = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [reviewsRes, reviewableRes] = await Promise.allSettled([
        apiClient.get("/reviews/my-reviews", { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get("/orders/reviewable-products", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (reviewsRes.status === "fulfilled") {
        setReviews(reviewsRes.value.data?.data?.reviews || []);
      }
      if (reviewableRes.status === "fulfilled") {
        setReviewable(reviewableRes.value.data?.data?.products || []);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleSubmitReview = useCallback(async () => {
    if (!activeReview || !comment.trim()) {
      setSubmitError("Lütfen bir yorum yazın.");
      return;
    }
    setSubmitStatus("loading");
    setSubmitError("");
    try {
      await apiClient.post(
        "/reviews",
        { productId: activeReview.productId, orderId: activeReview.orderId, rating, comment: comment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitStatus("success");
      setActiveReview(null);
      setComment("");
      setRating(5);
      await fetchReviews();
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Yorum gönderilemedi.";
      setSubmitError(msg);
      setSubmitStatus("error");
    }
  }, [activeReview, comment, rating, token, fetchReviews]);

  const STATUS_LABELS: Record<Review["status"], { label: string; className: string }> = {
    PENDING: { label: "İnceleniyor", className: "text-amber-600 bg-amber-50 border-amber-200" },
    APPROVED: { label: "Yayında", className: "text-green-700 bg-green-50 border-green-200" },
    REJECTED: { label: "Reddedildi", className: "text-red-600 bg-red-50 border-red-200" },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Değerlendirmelerim</h1>
        <p className="mt-1 text-slate-400 text-sm font-medium">Verdiğiniz ve bekleyen değerlendirmeleri yönetin.</p>
      </div>

      {/* Değerlendirme Bekleyen Ürünler */}
      {!loading && reviewable.length > 0 && (
        <div className="rounded-2xl border border-slate-100 p-6">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShoppingBag size={15} />
            Değerlendirilmeyi Bekleyen Ürünler
          </h2>
          <div className="space-y-3">
            {reviewable.map((product) => (
              <div key={`${product.orderId}-${product.productId}`} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-800 truncate">{product.name}</p>
                  <p className="text-xs text-slate-400 font-bold">{product.brand}</p>
                </div>
                <button
                  onClick={() => { setActiveReview(product); setRating(5); setComment(""); }}
                  className="shrink-0 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-[#ff5000] transition-colors"
                >
                  Değerlendir
                </button>
              </div>
            ))}
          </div>

          {/* Review Form */}
          {activeReview && (
            <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <p className="text-sm font-black text-slate-900">{activeReview.name} için yorum yaz</p>
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Puanınız</p>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Yorumunuz</p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Bu ürün hakkındaki deneyiminizi paylaşın..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all bg-white"
                />
              </div>
              {submitError && (
                <div className="flex items-center gap-2 text-red-500 text-sm font-bold">
                  <AlertCircle size={13} />
                  {submitError}
                </div>
              )}
              {submitStatus === "success" && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
                  <CheckCircle2 size={13} />
                  Yorumunuz gönderildi, inceleme sürecindedir.
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitReview}
                  disabled={submitStatus === "loading"}
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-[#ff5000] transition-colors disabled:opacity-50"
                >
                  {submitStatus === "loading" ? "Gönderiliyor..." : "Gönder"}
                </button>
                <button
                  onClick={() => setActiveReview(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Geçmiş Yorumlar */}
      <div>
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">Geçmiş Değerlendirmelerim</h2>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <ReviewSkeleton key={i} />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-8 py-12 text-center">
            <Star size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-800 font-black mb-1">Henüz değerlendirme yapmadınız</p>
            <p className="text-slate-400 text-sm font-medium">Aldığınız ürünleri değerlendirerek diğer alıcılara yardımcı olun.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const statusCfg = STATUS_LABELS[review.status];
              return (
                <div key={review._id} className="border border-slate-100 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img src={review.productImageUrl} alt={review.productName} className="w-12 h-12 object-cover rounded-xl bg-slate-100 shrink-0" />
                      <div>
                        <p className="text-sm font-black text-slate-800">{review.productName}</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {new Date(review.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${statusCfg.className}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <StarRating value={review.rating} />
                  <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed">{review.comment}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
