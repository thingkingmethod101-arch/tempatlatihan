'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Announcement {
  id: string;
  judul: string;
  isi: string;
  targetRole: string[];
  targetJenjang: string[];
}

const ROLE_OPTIONS = ['siswa', 'orang_tua', 'tutor', 'sekolah', 'admin'];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ judul: '', isi: '', targetRole: [] as string[], targetJenjang: '', expiresAt: '' });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function load() {
    apiFetch('/announcements').then(setAnnouncements).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  function toggleRole(role: string) {
    setForm((prev) => ({
      ...prev,
      targetRole: prev.targetRole.includes(role)
        ? prev.targetRole.filter((r) => r !== role)
        : [...prev.targetRole, role],
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch('/announcements', {
        method: 'POST',
        body: {
          judul: form.judul,
          isi: form.isi,
          targetRole: form.targetRole,
          targetJenjang: form.targetJenjang ? form.targetJenjang.split(',').map((s) => s.trim()) : [],
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        },
      });
      setForm({ judul: '', isi: '', targetRole: [], targetJenjang: '', expiresAt: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat pengumuman');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await apiFetch(`/announcements/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus');
    } finally {
      setDeletingId(null);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pengumuman</h1>

      <form onSubmit={handleCreate} className="border rounded p-4 mb-6 max-w-md space-y-2">
        <h2 className="font-semibold">Buat Pengumuman Baru</h2>
        <input className="w-full border p-2 rounded" placeholder="Judul"
          value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} required />
        <textarea className="w-full border p-2 rounded" placeholder="Isi pengumuman"
          value={form.isi} onChange={(e) => setForm({ ...form, isi: e.target.value })} required />
        <div>
          <p className="text-sm text-gray-600 mb-1">Target role (kosongkan = semua role):</p>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((role) => (
              <label key={role} className="flex items-center gap-1 text-sm border rounded px-2 py-1">
                <input type="checkbox" checked={form.targetRole.includes(role)} onChange={() => toggleRole(role)} />
                {role}
              </label>
            ))}
          </div>
        </div>
        <input className="w-full border p-2 rounded"
          placeholder="Target jenjang, pisah koma (mis. SMP,SMA) - kosongkan = semua"
          value={form.targetJenjang} onChange={(e) => setForm({ ...form, targetJenjang: e.target.value })} />
        <label className="text-sm text-gray-600">Kadaluarsa (opsional):</label>
        <input type="datetime-local" className="w-full border p-2 rounded"
          value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        <button type="submit" disabled={creating} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
          {creating ? 'Membuat...' : 'Buat Pengumuman'}
        </button>
      </form>

      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className="border rounded p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{a.judul}</p>
                <p className="text-sm text-gray-600">{a.isi}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Target: {a.targetRole.length ? a.targetRole.join(', ') : 'Semua role'}
                  {a.targetJenjang.length > 0 && ` · Jenjang: ${a.targetJenjang.join(', ')}`}
                </p>
              </div>
              <button
                disabled={deletingId === a.id}
                onClick={() => handleDelete(a.id)}
                className="text-red-600 text-sm disabled:opacity-50"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {announcements.length === 0 && <p className="text-gray-500">Belum ada pengumuman.</p>}
      </div>
    </div>
  );
}