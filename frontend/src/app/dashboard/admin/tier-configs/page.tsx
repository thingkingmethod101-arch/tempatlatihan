'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface TierConfig { id: string; nama: string; xpMultiplier: string; xpBaseDefault: number; }

export default function AdminTierConfigsPage() {
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [nama, setNama] = useState('');
  const [xpMultiplier, setXpMultiplier] = useState(1);
  const [xpBaseDefault, setXpBaseDefault] = useState(100);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    apiFetch('/tier-configs', { auth: false }).then(setTiers).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      await apiFetch('/tier-configs', { method: 'POST', body: { nama, xpMultiplier, xpBaseDefault } });
      setNama('');
      setXpMultiplier(1);
      setXpBaseDefault(100);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal membuat tier');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus tier ini? Pastikan tidak dipakai babak/soal manapun.')) return;
    try {
      await apiFetch(`/tier-configs/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal hapus (mungkin masih dipakai di tempat lain)');
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Kelola Tier</h1>
      <p className="text-sm text-gray-500 mb-4">
        Tier menentukan tingkat kesulitan/kelas soal dan pengali XP (contoh: "Tier Dasar", "Tier Lanjutan").
      </p>

      <form onSubmit={handleCreate} className="border rounded p-4 mb-6 space-y-2">
        <input className="w-full border p-2 rounded" placeholder="Nama tier (contoh: Tier Dasar)"
          value={nama} onChange={(e) => setNama(e.target.value)} required />
        <div className="flex gap-2">
          <input type="number" step="0.1" className="w-1/2 border p-2 rounded" placeholder="Pengali XP (mis. 1.0)"
            value={xpMultiplier} onChange={(e) => setXpMultiplier(Number(e.target.value))} required />
          <input type="number" className="w-1/2 border p-2 rounded" placeholder="XP Dasar (mis. 100)"
            value={xpBaseDefault} onChange={(e) => setXpBaseDefault(Number(e.target.value))} required />
        </div>
        <button type="submit" disabled={creating} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
          {creating ? 'Membuat...' : 'Tambah Tier'}
        </button>
        {message && <p className="text-sm text-red-600">{message}</p>}
      </form>

      <div className="space-y-2">
        {tiers.map((t) => (
          <div key={t.id} className="border rounded p-3 flex justify-between items-center">
            <span className="text-sm">{t.nama} — pengali {t.xpMultiplier}x, XP dasar {t.xpBaseDefault}</span>
            <button onClick={() => handleDelete(t.id)} className="text-red-600 text-xs underline">Hapus</button>
          </div>
        ))}
        {tiers.length === 0 && <p className="text-gray-500 text-sm">Belum ada tier.</p>}
      </div>
    </div>
  );
}