'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface ReferralRow {
  id: string;
  kode: string;
  tipe: string;
  status: string;
  persenDiskon: number | null;
  maxUsage: number | null;
  namaPemilik: string;
  kontakPemilik: string;
  pemilikPernahPakaiSendiri: boolean;
  jumlahDipakaiOrangLain: number;
  penggunaLain: string[];
}
interface UserOption { id: string; nama: string; kontak: string; }

export default function AdminReferralPage() {
  const [codes, setCodes] = useState<ReferralRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [ownerId, setOwnerId] = useState('');
  const [tipe, setTipe] = useState<'diskon' | 'cashback'>('diskon');
  const [persenDiskon, setPersenDiskon] = useState(10);
  const [maxUsage, setMaxUsage] = useState(10);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [jumlahCashback, setJumlahCashback] = useState(0);

  function load() {
    apiFetch('/referral').then(setCodes).catch((e) => setMessage(e.message));
    apiFetch('/users').then(setUsers).catch(() => {});
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      const body: any = { ownerId, tipe };
      if (tipe === 'diskon') { body.persenDiskon = persenDiskon; body.maxUsage = maxUsage; }
      if (tipe === 'cashback') { body.jumlahCashback = jumlahCashback; }
      const res = await apiFetch('/referral', { method: 'POST', body });
      setMessage(`Kode berhasil dibuat: ${res.kode}`);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal membuat kode');
    } finally {
      setCreating(false);
    }
  }

  async function handleSelesaikan(id: string) {
    if (!confirm('Tandai kode cashback ini selesai (sudah ditransfer manual)? Kode akan hangus.')) return;
    try {
      await apiFetch(`/referral/${id}/selesaikan`, { method: 'PATCH' });
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal update status');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus kode referral ini beserta semua riwayat pemakaiannya? Tidak bisa dibatalkan.')) return;
    try {
      await apiFetch(`/referral/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal hapus kode');
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Kode Referral</h1>

      <form onSubmit={handleCreate} className="border rounded p-4 mb-6 space-y-2">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Pemilik Akun</label>
        <select className="w-full border p-2 rounded" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required>
          <option value="">Pilih pemilik kode (akun)</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.nama} ({u.kontak})</option>)}
        </select>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih aski mau diskon atau cashback!</label>
        <select className="w-full border p-2 rounded" value={tipe} onChange={(e) => setTipe(e.target.value as any)}>
          <option value="diskon">Diskon Produk</option>
          <option value="cashback">Cashback (WA manual)</option>
        </select>
        {tipe === 'diskon' && (
          <div className="flex gap-2">
            <label>Max diskon %</label>
            <input type="number" className="w-1/2 border p-2 rounded" placeholder="Persen diskon (%)"
              value={persenDiskon} onChange={(e) => setPersenDiskon(Number(e.target.value))} />
            <label>Max orang pakai diskon</label>
            <input type="number" className="w-1/2 border p-2 rounded" placeholder="Maks. orang lain yang bisa pakai"
              value={maxUsage} onChange={(e) => setMaxUsage(Number(e.target.value))} />
          </div>
        )}
        {tipe === 'cashback' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Jumlah Cashback (Rp)</label>
            <input type="number" className="w-full border p-2 rounded"
              value={jumlahCashback} onChange={(e) => setJumlahCashback(Number(e.target.value))} />
          </div>
        )}
        <button type="submit" disabled={creating} className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50">
          {creating ? 'Membuat...' : 'Buat Kode'}
        </button>
        {message && <p className="text-sm">{message}</p>}
      </form>

      

      <h2 className="font-semibold mb-2">Semua Kode Referral</h2>
      <div className="space-y-3">
        {codes.map((c) => (
          <div key={c.id} className="border rounded p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono font-bold text-sm">{c.kode} <span className="text-xs text-gray-400">({c.tipe})</span></p>
                <p className="text-xs text-gray-500">Pemilik: {c.namaPemilik} ({c.kontakPemilik})</p>
                {c.tipe === 'diskon' && (
                  <p className="text-xs text-gray-600 mt-1">
                    Diskon {c.persenDiskon}% · Dipakai {c.jumlahDipakaiOrangLain}/{c.maxUsage} orang lain
                    {c.pemilikPernahPakaiSendiri && <span className="text-orange-600"> · Pemilik sudah pakai sendiri</span>}
                  </p>
                )}
                {c.penggunaLain.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Dipakai oleh: {c.penggunaLain.join(', ')}</p>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded ${c.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {c.status}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              {c.tipe === 'cashback' && c.status === 'aktif' && (
                <button onClick={() => handleSelesaikan(c.id)} className="text-xs bg-black text-white px-3 py-1 rounded">
                  Tandai Selesai (Sudah Transfer)
                </button>
              )}
              <button onClick={() => handleDelete(c.id)} className="text-xs bg-red-600 text-white px-3 py-1 rounded">
                Hapus
              </button>
            </div>
          </div>
        ))}
        {codes.length === 0 && <p className="text-gray-500 text-sm">Belum ada kode referral.</p>}
      </div>
    </div>
  );
}