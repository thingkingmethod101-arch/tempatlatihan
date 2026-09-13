'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface SkillNode { id: string; nama: string; parentSkillId: string | null; }

export default function AdminSkillNodesPage() {
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [nama, setNama] = useState('');
  const [parentSkillId, setParentSkillId] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    apiFetch('/skill-nodes', { auth: false }).then(setNodes).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      await apiFetch('/skill-nodes', { method: 'POST', body: { nama, parentSkillId: parentSkillId || undefined } });
      setNama('');
      setParentSkillId('');
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal membuat skill node');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus skill node ini? Pastikan tidak dipakai soal/event/modul manapun.')) return;
    try {
      await apiFetch(`/skill-nodes/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal hapus (mungkin masih dipakai di tempat lain)');
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Kelola Skill Node</h1>
      <p className="text-sm text-gray-500 mb-4">
        Skill node dipakai untuk mengelompokkan soal, event, dan modul (misal: Matematika, Fisika, Bahasa Inggris).
      </p>

      <form onSubmit={handleCreate} className="border rounded p-4 mb-6 space-y-2">
        <input className="w-full border p-2 rounded" placeholder="Nama skill (contoh: Matematika)"
          value={nama} onChange={(e) => setNama(e.target.value)} required />
        <select className="w-full border p-2 rounded" value={parentSkillId} onChange={(e) => setParentSkillId(e.target.value)}>
          <option value="">Tanpa induk (skill utama)</option>
          {nodes.map((n) => <option key={n.id} value={n.id}>{n.nama}</option>)}
        </select>
        <button type="submit" disabled={creating} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
          {creating ? 'Membuat...' : 'Tambah Skill Node'}
        </button>
        {message && <p className="text-sm text-red-600">{message}</p>}
      </form>

      <div className="space-y-2">
        {nodes.map((n) => (
          <div key={n.id} className="border rounded p-3 flex justify-between items-center">
            <span className="text-sm">{n.nama}</span>
            <button onClick={() => handleDelete(n.id)} className="text-red-600 text-xs underline">Hapus</button>
          </div>
        ))}
        {nodes.length === 0 && <p className="text-gray-500 text-sm">Belum ada skill node.</p>}
      </div>
    </div>
  );
}