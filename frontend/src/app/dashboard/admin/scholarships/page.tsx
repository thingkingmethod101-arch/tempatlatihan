'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Program {
  id: string;
  nama: string;
  tipe: string;
  kuota: number | null;
  deadlineAt: string | null;
}

export default function AdminScholarshipsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: '', tipe: 'dana_tunai', kriteria: '', kuota: 20, deadlineAt: '' });
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  function load() {
    apiFetch('/scholarship-programs').then(setPrograms).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      await apiFetch('/scholarship-programs', {
        method: 'POST',
        body: {
          ...form,
          kuota: Number(form.kuota),
          deadlineAt: form.deadlineAt ? new Date(form.deadlineAt).toISOString() : undefined,
        },
      });
      setMessage('Program berhasil dibuat.');
      setForm({ nama: '', tipe: 'dana_tunai', kriteria: '', kuota: 20, deadlineAt: '' });
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal membuat program');
    } finally {
      setCreating(false);
    }
  }

  async function handleTriggerReminder() {
    setTriggering(true);
    try {
      const res = await apiFetch('/scholarship-programs/trigger-reminder-check', { method: 'POST' });
      setMessage(`Reminder dicek: ${res.programDicek} program, ${res.reminderDikirim} reminder terkirim.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal trigger reminder');
    } finally {
      setTriggering(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Kelola Beasiswa</h1>

      <button onClick={handleTriggerReminder} disabled={triggering}
        className="mb-4 bg-gray-800 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
        {triggering ? 'Memproses...' : 'Cek Reminder H-7 Sekarang'}
      </button>

      <form onSubmit={handleCreate} className="border rounded p-4 mb-6 max-w-md space-y-2">
        <h2 className="font-semibold">Buat Program Baru</h2>
        <input className="w-full border p-2 rounded" placeholder="Nama program"
          value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
        <select className="w-full border p-2 rounded" value={form.tipe}
          onChange={(e) => setForm({ ...form, tipe: e.target.value })}>
          <option value="dana_tunai">Dana Tunai</option>
          <option value="akses_konten">Akses Konten</option>
        </select>
        <input className="w-full border p-2 rounded" placeholder="Kriteria"
          value={form.kriteria} onChange={(e) => setForm({ ...form, kriteria: e.target.value })} />
        <input type="number" className="w-full border p-2 rounded" placeholder="Kuota"
          value={form.kuota} onChange={(e) => setForm({ ...form, kuota: Number(e.target.value) })} />
        <label className="text-sm text-gray-600">Tenggat waktu:</label>
        <input type="datetime-local" className="w-full border p-2 rounded"
          value={form.deadlineAt} onChange={(e) => setForm({ ...form, deadlineAt: e.target.value })} />
        <button type="submit" disabled={creating} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
          {creating ? 'Membuat...' : 'Buat Program'}
        </button>
        {message && <p className="text-sm">{message}</p>}
      </form>

      <div className="space-y-3">
        {programs.map((p) => (
          <Link key={p.id} href={`/dashboard/admin/scholarships/${p.id}`}
            className="block border rounded p-4 hover:bg-gray-50">
            <p className="font-medium">{p.nama}</p>
            <p className="text-sm text-gray-500">
              {p.tipe} · Kuota {p.kuota ?? '-'} · Tenggat{' '}
              {p.deadlineAt ? new Date(p.deadlineAt).toLocaleDateString('id-ID') : '-'}
            </p>
          </Link>
        ))}
        {programs.length === 0 && <p className="text-gray-500">Belum ada program beasiswa.</p>}
      </div>
    </div>
  );
}