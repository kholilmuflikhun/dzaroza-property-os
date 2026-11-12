"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";

type QuotationDetail = {
  id: string; number: string; status: string; subtotal: string; discount: string; tax: string; total: string;
  issuedAt: string | null; createdAt: string;
  client: { id: string; name: string; email: string | null; phone: string | null };
  project?: { id: string; code: string; name: string; status: string } | null;
  items: Array<{ id: string; description: string; quantity: string; unitPrice: string; lineTotal: string }>;
};
type Activity = { id: string; action: string; createdAt: string; actor: { name: string | null } | null };
const money = (value: string | number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
const date = (value: string | null) => value ? new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";
const labels: Record<string, string> = { DRAFT: "Draft", SENT: "Menunggu klien", ACCEPTED: "Disetujui", REJECTED: "Ditolak", EXPIRED: "Kedaluwarsa", CONVERTED: "Menjadi proyek" };
const activityLabels: Record<string, string> = {
  "quotation.created": "Quotation dibuat", "quotation.updated": "Quotation diperbarui",
  "quotation.sent": "Quotation diterbitkan", "quotation.approved": "Quotation disetujui",
  "quotation.rejected": "Quotation ditolak", "quotation.converted": "Quotation dikonversi menjadi proyek",
};

export default function QuotationDetailPage() {
  const params = useParams<{ organizationId: string; quotationId: string }>();
  const { organizationId, quotationId } = params;
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError("");
      try {
        const base = `/api/organizations/${encodeURIComponent(organizationId)}`;
        const [quotationResponse, activityResponse] = await Promise.all([
          fetch(`${base}/quotations/${encodeURIComponent(quotationId)}`, { cache: "no-store" }),
          fetch(`${base}/activity/quotation/${encodeURIComponent(quotationId)}`, { cache: "no-store" }),
        ]);
        const [quotationPayload, activityPayload] = await Promise.all([quotationResponse.json(), activityResponse.json()]);
        if (!quotationResponse.ok) throw new Error(quotationPayload.error ?? "Detail quotation tidak dapat dimuat.");
        if (!activityResponse.ok) throw new Error(activityPayload.error ?? "Riwayat quotation tidak dapat dimuat.");
        if (active) { setQuotation(quotationPayload.quotation); setActivities(activityPayload.activities ?? []); }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Detail quotation tidak dapat dimuat.");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [organizationId, quotationId]);

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Memuat detail quotation…</div>;
  if (error || !quotation) return <div className="space-y-4"><p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error || "Quotation tidak ditemukan."}</p><Link className="text-sm font-semibold text-blue-700" href={`/dashboard/${organizationId}/quotations`}>Kembali ke daftar quotation</Link></div>;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><Link href={`/dashboard/${organizationId}/quotations`} className="text-sm font-semibold text-blue-700">← Daftar quotation</Link><p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-blue-700">Sales · Detail penawaran</p><h1 className="mt-1 text-3xl font-bold text-slate-950">{quotation.number}</h1><p className="mt-1 text-sm text-slate-500">Dibuat {date(quotation.createdAt)}</p></div><StatusBadge status={quotation.status} label={labels[quotation.status] ?? quotation.status}/></header>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Nilai penawaran</p><p className="mt-2 text-xl font-bold">{money(quotation.total)}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Tanggal diterbitkan</p><p className="mt-2 font-semibold">{date(quotation.issuedAt)}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Jumlah item</p><p className="mt-2 font-semibold">{quotation.items.length} item</p></div></section>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-950">Rincian penawaran</h2><div className="mt-4 space-y-3">{quotation.items.map((item) => <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3"><div><p className="font-medium text-slate-900">{item.description}</p><p className="mt-1 text-xs text-slate-500">{item.quantity} × {money(item.unitPrice)}</p></div><p className="font-semibold">{money(item.lineTotal)}</p></div>)}</div><dl className="ml-auto mt-5 max-w-sm space-y-2 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{money(quotation.subtotal)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Diskon</dt><dd>{money(quotation.discount)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Pajak</dt><dd>{money(quotation.tax)}</dd></div><div className="flex justify-between border-t border-slate-200 pt-3 font-bold"><dt>Total</dt><dd>{money(quotation.total)}</dd></div></dl></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-950">Informasi klien & proyek</h2><p className="mt-3 font-medium text-slate-900">{quotation.client.name}</p>{quotation.client.email && <p className="mt-1 text-sm text-slate-600">{quotation.client.email}</p>}{quotation.client.phone && <p className="mt-1 text-sm text-slate-600">{quotation.client.phone}</p>}{quotation.project && <p className="mt-3 text-sm text-slate-600">{quotation.project.code} · {quotation.project.name}</p>}</section>
    </div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-slate-950">Riwayat aktivitas</h2><span className="text-xs text-slate-500">Maksimal 50 aktivitas terbaru</span></div>{activities.length === 0 ? <p className="mt-4 text-sm text-slate-500">Belum ada catatan aktivitas untuk quotation ini.</p> : <ol className="mt-4 space-y-4">{activities.map((activity) => <li key={activity.id} className="relative border-l-2 border-slate-200 pl-4"><span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-blue-600"/><p className="text-sm font-medium text-slate-900">{activityLabels[activity.action] ?? activity.action.replaceAll(".", " ")}</p><p className="mt-1 text-xs text-slate-500">{activity.actor?.name ?? "Sistem"} · {date(activity.createdAt)}</p></li>)}</ol>}</section>
  </div>;
}
