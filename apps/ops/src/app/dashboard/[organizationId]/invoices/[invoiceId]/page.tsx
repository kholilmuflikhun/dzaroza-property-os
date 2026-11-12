"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";

type InvoiceDetail = {
  id: string; number: string; status: string; subtotal: string; discount: string; tax: string;
  total: string; paidAmount: string; dueAt: string | null; issuedAt: string | null; createdAt: string;
  items: Array<{ id: string; description: string; quantity: string; unitPrice: string; lineTotal: string }>;
  project?: { code: string; name: string; client?: { name: string; email: string | null; phone: string | null } | null } | null;
  quotation?: { id: string; number: string; status: string; client?: { name: string; email: string | null; phone: string | null } } | null;
  payments: Array<{ id: string; amount: string; provider: string; status: string; paidAt: string | null; createdAt: string }>;
};
type Activity = { id: string; action: string; createdAt: string; actor: { name: string | null } | null };

const money = (value: string | number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
const date = (value: string | null) => value ? new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";
const labels: Record<string, string> = { DRAFT: "Draft", SENT: "Terbit", PARTIALLY_PAID: "Dibayar sebagian", PAID: "Lunas", OVERDUE: "Jatuh tempo", VOID: "Dibatalkan" };
const activityLabels: Record<string, string> = {
  "invoice.created": "Invoice dibuat", "invoice.issued": "Invoice diterbitkan",
  "invoice.voided": "Invoice dibatalkan", "invoice.email.sent": "Email invoice dikirim",
  "invoice.email.failed": "Pengiriman email gagal", "payment.settled": "Pembayaran diterima",
};

export default function InvoiceDetailPage() {
  const params = useParams<{ organizationId: string; invoiceId: string }>();
  const { organizationId, invoiceId } = params;
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError("");
      try {
        const base = `/api/organizations/${encodeURIComponent(organizationId)}`;
        const [invoiceResponse, activityResponse] = await Promise.all([
          fetch(`${base}/invoices/${encodeURIComponent(invoiceId)}`, { cache: "no-store" }),
          fetch(`${base}/activity/invoice/${encodeURIComponent(invoiceId)}`, { cache: "no-store" }),
        ]);
        const [invoicePayload, activityPayload] = await Promise.all([invoiceResponse.json(), activityResponse.json()]);
        if (!invoiceResponse.ok) throw new Error(invoicePayload.error ?? "Detail invoice tidak dapat dimuat.");
        if (!activityResponse.ok) throw new Error(activityPayload.error ?? "Riwayat invoice tidak dapat dimuat.");
        if (active) { setInvoice(invoicePayload.invoice); setActivities(activityPayload.activities ?? []); }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Detail invoice tidak dapat dimuat.");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [organizationId, invoiceId]);

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Memuat detail invoice…</div>;
  if (error || !invoice) return <div className="space-y-4"><p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error || "Invoice tidak ditemukan."}</p><Link className="text-sm font-semibold text-blue-700" href={`/dashboard/${organizationId}/invoices`}>Kembali ke daftar invoice</Link></div>;

  const client = invoice.project?.client ?? invoice.quotation?.client;
  const balance = Number(invoice.total) - Number(invoice.paidAmount);
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><Link href={`/dashboard/${organizationId}/invoices`} className="text-sm font-semibold text-blue-700">← Daftar invoice</Link><p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-blue-700">Finance · Detail transaksi</p><h1 className="mt-1 text-3xl font-bold text-slate-950">{invoice.number}</h1><p className="mt-1 text-sm text-slate-500">Dibuat {date(invoice.createdAt)}</p></div>
      <StatusBadge status={invoice.status} label={labels[invoice.status] ?? invoice.status}/>
    </header>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[["Total invoice", money(invoice.total)], ["Sudah dibayar", money(invoice.paidAmount)], ["Sisa tagihan", money(balance)], ["Jatuh tempo", date(invoice.dueAt)]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-lg font-bold tabular-nums text-slate-950">{value}</p></div>)}
    </section>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Rincian tagihan</h2>
        <div className="mt-4 space-y-3">{invoice.items.map((item) => <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3"><div><p className="font-medium text-slate-900">{item.description}</p><p className="mt-1 text-xs text-slate-500">{item.quantity} × {money(item.unitPrice)}</p></div><p className="font-semibold tabular-nums">{money(item.lineTotal)}</p></div>)}</div>
        <dl className="ml-auto mt-5 max-w-sm space-y-2 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{money(invoice.subtotal)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Diskon</dt><dd>{money(invoice.discount)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Pajak</dt><dd>{money(invoice.tax)}</dd></div><div className="flex justify-between border-t border-slate-200 pt-3 font-bold"><dt>Total</dt><dd>{money(invoice.total)}</dd></div></dl>
      </section>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-950">Informasi klien & proyek</h2><p className="mt-3 font-medium text-slate-900">{client?.name ?? "Klien tidak tersedia"}</p>{client?.email && <p className="mt-1 text-sm text-slate-600">{client.email}</p>}{client?.phone && <p className="mt-1 text-sm text-slate-600">{client.phone}</p>}{invoice.project && <p className="mt-3 text-sm text-slate-600">{invoice.project.code} · {invoice.project.name}</p>}{invoice.quotation && <p className="mt-2 text-sm text-slate-600">Sumber quotation: {invoice.quotation.number}</p>}<p className="mt-3 text-xs text-slate-500">Diterbitkan: {date(invoice.issuedAt)}</p></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-950">Pembayaran diterima</h2>{invoice.payments.length === 0 ? <p className="mt-3 text-sm text-slate-500">Belum ada pembayaran settlement.</p> : <div className="mt-3 space-y-3">{invoice.payments.map((payment) => <div key={payment.id} className="border-b border-slate-100 pb-3 last:border-0"><p className="font-semibold">{money(payment.amount)}</p><p className="mt-1 text-xs text-slate-500">{payment.provider} · {date(payment.paidAt ?? payment.createdAt)}</p></div>)}</div>}</section>
      </div>
    </div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-slate-950">Riwayat aktivitas</h2><span className="text-xs text-slate-500">Maksimal 50 aktivitas terbaru</span></div>{activities.length === 0 ? <p className="mt-4 text-sm text-slate-500">Belum ada catatan aktivitas untuk invoice ini.</p> : <ol className="mt-4 space-y-4">{activities.map((activity) => <li key={activity.id} className="relative border-l-2 border-slate-200 pl-4"><span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-blue-600"/><p className="text-sm font-medium text-slate-900">{activityLabels[activity.action] ?? activity.action.replaceAll(".", " ")}</p><p className="mt-1 text-xs text-slate-500">{activity.actor?.name ?? "Sistem"} · {date(activity.createdAt)}</p></li>)}</ol>}</section>
  </div>;
}
