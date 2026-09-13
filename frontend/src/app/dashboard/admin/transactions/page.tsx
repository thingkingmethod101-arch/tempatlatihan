'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

interface Transaction {
  id: string;
  amount: string;
  kodeUnik: number | null;
  totalTransfer: number;
  status: string;
  createdAt: string;
  user: { nama: string; kontak: string };
  namaProduk: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function load() {
    apiFetch('/transactions/admin/pending').then(setTransactions).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  async function handleConfirm(id: string) {
    setConfirmingId(id);
    try {
      await apiFetch(`/transactions/${id}/confirm-manual`, { method: 'PATCH' });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal konfirmasi');
    } finally {
      setConfirmingId(null);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Konfirmasi Pembayaran Manual</h1>
      <Link href="/dashboard/admin/royalties" className="text-sm text-blue-600 underline">
        Lihat Detail Royalti per Modul →
      </Link>

      <Link href="/dashboard/admin/pembukuan" className="text-sm text-blue-600 underline ml-4">
        Lihat Pembukuan →
      </Link>

      <p className="text-sm text-gray-500 mb-4">
        Cek dulu mutasi transfer bank sebelum konfirmasi — aksi ini langsung memberi akses konten ke siswa.
      </p>

      <div className="space-y-3">
        {transactions.map((t) => (
          <div key={t.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{t.user.nama} ({t.user.kontak})</p>
              <p className="text-sm text-gray-500">Rp{t.amount} · {new Date(t.createdAt).toLocaleString('id-ID')}</p>
              <p className="text-sm font-semibold">Transfer: Rp{t.totalTransfer.toLocaleString('id-ID')} (kode: {t.kodeUnik})</p>
              <p className="text-xs text-gray-400">{t.namaProduk}</p>
            </div>
            <button
              disabled={confirmingId === t.id}
              onClick={() => handleConfirm(t.id)}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              {confirmingId === t.id ? 'Memproses...' : 'Konfirmasi Lunas'}
            </button>
          </div>
        ))}
        {transactions.length === 0 && <p className="text-gray-500">Tidak ada transaksi pending.</p>}
      </div>
    </div>
  );
}