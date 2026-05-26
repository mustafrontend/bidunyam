"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useSellerAuthStore } from "@/stores/sellerAuthStore";

interface Ticket {
  id: string;
  type: "iade" | "hasarli" | "kayip" | "bilgi" | "diger";
  title: string;
  description: string;
  orderId?: string;
  status: "acik" | "inceleniyor" | "cozuldu" | "kapali";
  priority: "dusuk" | "normal" | "yuksek" | "kritik";
  createdAt: string;
  note?: string;
}

interface Order {
  _id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: { name: string }[];
}

const PRIORITY_COLOR: Record<string, string> = {
  dusuk: "bg-slate-100 text-slate-600",
  normal: "bg-blue-100 text-blue-700",
  yuksek: "bg-amber-100 text-amber-700",
  kritik: "bg-red-100 text-red-700",
};

const TICKET_STATUS_COLOR: Record<string, string> = {
  acik: "bg-red-100 text-red-700",
  inceleniyor: "bg-amber-100 text-amber-700",
  cozuldu: "bg-green-100 text-green-700",
  kapali: "bg-slate-100 text-slate-500",
};

const TICKET_STATUS_TR: Record<string, string> = {
  acik: "Acik", inceleniyor: "Inceleniyor", cozuldu: "Cozuldu", kapali: "Kapali",
};

const TYPE_TR: Record<string, string> = {
  iade: "Iade Talebi", hasarli: "Hasarli Urun", kayip: "Kayip Kargo",
  bilgi: "Bilgi Talebi", diger: "Diger",
};

const MOCK_NOTES = [
  "Musteri dondurulmus kartla odeme yapti.",
  "Kargo firmasi bilgi vermedi, takip numarasi gecersiz.",
  "Urun resimde gorundugu gibi degil diye sikayet var.",
  "Iade talebi onaylandi, kargo etiketi gonderilecek.",
];

function generateTicketsFromOrders(orders: Order[]): Ticket[] {
  const tickets: Ticket[] = [];
  orders.filter((o) => o.status === "CANCELLED").forEach((o, i) => {
    tickets.push({
      id: `tick-${o._id.slice(-6)}`,
      type: ["iade", "diger"][i % 2] as Ticket["type"],
      title: `Siparis iptal - iade talebi`,
      description: `${o.items.map((i) => i.name).join(", ")} siparisi iptal edildi, musteri iade istiyor.`,
      orderId: o._id,
      status: i % 3 === 0 ? "acik" : i % 3 === 1 ? "inceleniyor" : "cozuldu",
      priority: i % 4 === 0 ? "kritik" : i % 4 === 1 ? "yuksek" : "normal",
      createdAt: o.createdAt,
      note: MOCK_NOTES[i % MOCK_NOTES.length],
    });
  });
  if (tickets.length < 5) {
    const extras: Ticket[] = [
      { id: "tick-001", type: "kayip", title: "Kargo kayboldu", description: "Musterinin kargosuna 10 gundur ulasamiyor.", status: "acik", priority: "kritik", createdAt: new Date().toISOString() },
      { id: "tick-002", type: "hasarli", title: "Urun hasarli geldi", description: "Paket acildiginda urun kirili cikti.", status: "inceleniyor", priority: "yuksek", createdAt: new Date().toISOString() },
      { id: "tick-003", type: "bilgi", title: "Garanti suresi sorgusu", description: "Urun garantisi hakkinda bilgi isteniyor.", status: "cozuldu", priority: "dusuk", createdAt: new Date().toISOString() },
      { id: "tick-004", type: "iade", title: "Yanlis urun gonderildi", description: "Siparis edilen urun yerine baska urun gonderilmis.", status: "acik", priority: "yuksek", createdAt: new Date().toISOString() },
      { id: "tick-005", type: "diger", title: "Fatura talebi", description: "Musteri e-fatura kopyasi istiyor.", status: "kapali", priority: "dusuk", createdAt: new Date().toISOString() },
    ];
    tickets.push(...extras.slice(0, 5 - tickets.length));
  }
  return tickets;
}

export default function DestekPage() {
  const { token } = useSellerAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Tumu");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({ title: "", description: "", type: "diger", priority: "normal" });

  useEffect(() => {
    apiClient.get("/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const orders: Order[] = res.data?.data || [];
        setTickets(generateTicketsFromOrders(orders));
      })
      .catch(() => setTickets(generateTicketsFromOrders([])))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = tickets.filter((t) => statusFilter === "Tumu" || t.status === statusFilter);

  const updateStatus = (id: string, status: Ticket["status"]) => {
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : s);
  };

  const addNote = (id: string) => {
    if (!noteInput.trim()) return;
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, note: noteInput } : t));
    if (selected?.id === id) setSelected((s) => s ? { ...s, note: noteInput } : s);
    setNoteInput("");
  };

  const createTicket = () => {
    if (!newForm.title) return;
    const t: Ticket = {
      id: `tick-${Date.now()}`,
      type: newForm.type as Ticket["type"],
      title: newForm.title,
      description: newForm.description,
      status: "acik",
      priority: newForm.priority as Ticket["priority"],
      createdAt: new Date().toISOString(),
    };
    setTickets((prev) => [t, ...prev]);
    setShowNewForm(false);
    setNewForm({ title: "", description: "", type: "diger", priority: "normal" });
  };

  const counts = { acik: tickets.filter((t) => t.status === "acik").length, inceleniyor: tickets.filter((t) => t.status === "inceleniyor").length };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Musteri Destek</h2>
          <p className="text-sm text-slate-500 mt-1">{counts.acik} acik, {counts.inceleniyor} incelemede</p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="rounded-xl bg-[#ff6000] px-5 py-2.5 text-sm font-black text-white hover:bg-[#d85000] transition-colors"
        >
          + Yeni Talep
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Acik", count: tickets.filter((t) => t.status === "acik").length, color: "border-l-red-500" },
          { label: "Inceleniyor", count: tickets.filter((t) => t.status === "inceleniyor").length, color: "border-l-amber-500" },
          { label: "Cozuldu", count: tickets.filter((t) => t.status === "cozuldu").length, color: "border-l-green-500" },
          { label: "Toplam", count: tickets.length, color: "border-l-blue-500" },
        ].map((c) => (
          <div key={c.label} className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${c.color}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-800">{c.count}</p>
          </div>
        ))}
      </div>

      {/* New Ticket Form */}
      {showNewForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-black text-slate-700">Yeni Destek Talebi</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Baslik</label>
              <input value={newForm.title} onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Tur</label>
                <select value={newForm.type} onChange={(e) => setNewForm((f) => ({ ...f, type: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-2 py-2.5 text-sm outline-none focus:border-[#ff6000]">
                  {Object.entries(TYPE_TR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Oncelik</label>
                <select value={newForm.priority} onChange={(e) => setNewForm((f) => ({ ...f, priority: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-2 py-2.5 text-sm outline-none focus:border-[#ff6000]">
                  <option value="dusuk">Dusuk</option>
                  <option value="normal">Normal</option>
                  <option value="yuksek">Yuksek</option>
                  <option value="kritik">Kritik</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Aciklama</label>
              <textarea rows={2} value={newForm.description} onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={createTicket} className="rounded-lg bg-[#ff6000] px-5 py-2 text-sm font-black text-white">Olustur</button>
            <button onClick={() => setShowNewForm(false)} className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600">Vazgec</button>
          </div>
        </div>
      )}

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {["Tumu", "acik", "inceleniyor", "cozuldu", "kapali"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold border transition-colors ${statusFilter === s ? "bg-[#ff6000] text-white border-[#ff6000]" : "bg-white text-slate-600 border-slate-200 hover:border-[#ff6000]"}`}
          >
            {s === "Tumu" ? "Tumu" : TICKET_STATUS_TR[s]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        {/* Ticket List */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-white" />)
          ) : filtered.length === 0 ? (
            <div className="rounded-xl bg-white p-16 text-center text-slate-400 font-semibold shadow-sm border border-slate-100">Talep bulunamadi.</div>
          ) : filtered.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => { setSelected(ticket); setNoteInput(ticket.note || ""); }}
              className={`rounded-xl border bg-white p-5 cursor-pointer transition-colors ${selected?.id === ticket.id ? "border-[#ff6000]/50 bg-orange-50/40" : "border-slate-100 hover:border-slate-200"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TICKET_STATUS_COLOR[ticket.status]}`}>{TICKET_STATUS_TR[ticket.status]}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${PRIORITY_COLOR[ticket.priority]}`}>{ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">{TYPE_TR[ticket.type]}</span>
                  </div>
                  <p className="font-bold text-slate-800 truncate">{ticket.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{ticket.description}</p>
                </div>
                <p className="text-xs text-slate-400 whitespace-nowrap">{new Date(ticket.createdAt).toLocaleDateString("tr-TR")}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Ticket Detail */}
        {selected && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase text-slate-500">Talep Detayi</p>
                <p className="font-mono text-xs text-slate-400">{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">x</button>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-1">{selected.title}</p>
              <p className="text-sm text-slate-600">{selected.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${TICKET_STATUS_COLOR[selected.status]}`}>{TICKET_STATUS_TR[selected.status]}</span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${PRIORITY_COLOR[selected.priority]}`}>{selected.priority}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">{TYPE_TR[selected.type]}</span>
            </div>

            <div>
              <p className="mb-2 text-xs font-black uppercase text-slate-500">Durum Guncelle</p>
              <div className="grid grid-cols-2 gap-2">
                {(["acik", "inceleniyor", "cozuldu", "kapali"] as const).map((s) => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)}
                    className={`rounded-lg border py-2 text-xs font-bold transition-colors ${selected.status === s ? "bg-[#ff6000] text-white border-[#ff6000]" : "border-slate-200 text-slate-600 hover:border-[#ff6000]"}`}
                  >
                    {TICKET_STATUS_TR[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-black uppercase text-slate-500">Not / Yanit</p>
              {selected.note && <div className="mb-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{selected.note}</div>}
              <textarea
                rows={3}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Not ekle veya musteri yaniti..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#ff6000]"
              />
              <button onClick={() => addNote(selected.id)} className="mt-2 rounded-lg bg-[#ff6000] px-4 py-1.5 text-xs font-black text-white">Notu Kaydet</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
