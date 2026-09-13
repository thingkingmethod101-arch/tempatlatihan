'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface SkillNode { id: string; nama: string; }
interface EventItem {
  id: string;
  nama: string;
  tipe: string;
  status: string;
  jenjang: string;
  rounds: { id: string }[];
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [skillNodes, setSkillNodes] = useState<SkillNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: '', tipe: 'tryout', mode: 'individual', jenjang: 'SMP', skillNodeId: '' });
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    apiFetch('/events/admin/all').then(setEvents).catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
    apiFetch('/skill-nodes', { auth: false }).then(setSkillNodes).catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      await apiFetch('/events', { method: 'POST', body: form });
      setMessage('Event berhasil dibuat.');
      setForm({ nama: '', tipe: 'tryout', mode: 'individual', jenjang: 'SMP', skillNodeId: '' });
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal membuat event');
    } finally {
      setCreating(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Kelola Event</h1>

      <form onSubmit={handleCreate} className="border rounded p-4 mb-6 max-w-md space-y-2">
        <h2 className="font-semibold">Buat Event Baru</h2>
        <input className="w-full border p-2 rounded" placeholder="Nama event"
          value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
        <input className="w-full border p-2 rounded" placeholder="Tipe (mis. tryout, osn)"
          value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })} required />
        <select className="w-full border p-2 rounded" value={form.mode}
          onChange={(e) => setForm({ ...form, mode: e.target.value })}>
          <option value="individual">Individual</option>
          <option value="tim">Tim</option>
        </select>
        <input className="w-full border p-2 rounded" placeholder="Jenjang (mis. SMP, SMA)"
          value={form.jenjang} onChange={(e) => setForm({ ...form, jenjang: e.target.value })} required />
        <select className="w-full border p-2 rounded" value={form.skillNodeId}
          onChange={(e) => setForm({ ...form, skillNodeId: e.target.value })} required>
          <option value="">Pilih Skill Node</option>
          {skillNodes.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
        </select>
        <button type="submit" disabled={creating} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
          {creating ? 'Membuat...' : 'Buat Event'}
        </button>
        {message && <p className="text-sm">{message}</p>}
      </form>

      <div className="space-y-3">
        {events.map((ev) => (
          <Link key={ev.id} href={`/dashboard/admin/events/${ev.id}`}
            className="block border rounded p-4 hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{ev.nama}</p>
                <p className="text-sm text-gray-500">{ev.tipe} · {ev.jenjang} · {ev.rounds.length} babak</p>
              </div>
              <span className={
                'text-xs px-2 py-1 rounded ' +
                (ev.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')
              }>
                {ev.status}
              </span>
            </div>
          </Link>
        ))}
        {events.length === 0 && <p className="text-gray-500">Belum ada event.</p>}
      </div>
    </div>
  );
}