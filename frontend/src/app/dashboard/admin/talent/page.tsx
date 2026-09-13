'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface SkillNode { id: string; nama: string; }
interface Mapping {
  id: string;
  saranJurusan: string[];
  saranKarier: string[];
  skillNode: { nama: string };
}

export default function AdminTalentPage() {
  const [skillNodes, setSkillNodes] = useState<SkillNode[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  const [form, setForm] = useState({ skillNodeId: '', saranJurusan: '', saranKarier: '' });

  function load() {
    apiFetch('/talent/career-mappings').then(setMappings).catch((e) => setError(e.message));
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
      await apiFetch('/talent/career-mappings', {
        method: 'POST',
        body: {
          skillNodeId: form.skillNodeId,
          saranJurusan: form.saranJurusan.split(',').map((s) => s.trim()).filter(Boolean),
          saranKarier: form.saranKarier.split(',').map((s) => s.trim()).filter(Boolean),
        },
      });
      setMessage('Pemetaan karier berhasil dibuat.');
      setForm({ skillNodeId: '', saranJurusan: '', saranKarier: '' });
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal membuat pemetaan');
    } finally {
      setCreating(false);
    }
  }

  async function handleRecompute() {
    setRecomputing(true);
    setMessage(null);
    try {
      const res = await apiFetch('/talent/trigger-recompute', { method: 'POST' });
      setMessage(`Selesai! ${res.userSkillDiproses} kombinasi siswa-skill diproses.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal trigger recompute');
    } finally {
      setRecomputing(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Pemetaan Talenta</h1>

      <button onClick={handleRecompute} disabled={recomputing}
        className="mb-4 bg-gray-800 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
        {recomputing ? 'Memproses...' : 'Hitung Ulang TalentSummaryCache Sekarang'}
      </button>
      {message && <p className="text-sm bg-blue-50 border border-blue-200 p-2 rounded mb-4">{message}</p>}

      <form onSubmit={handleCreate} className="border rounded p-4 mb-6 space-y-2">
        <h2 className="font-semibold">Buat Pemetaan Karier Baru</h2>
        <select className="w-full border p-2 rounded" value={form.skillNodeId}
          onChange={(e) => setForm({ ...form, skillNodeId: e.target.value })} required>
          <option value="">Pilih Skill Node</option>
          {skillNodes.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
        </select>
        <input className="w-full border p-2 rounded" placeholder="Saran jurusan, pisah koma (mis. Teknik Informatika, Matematika)"
          value={form.saranJurusan} onChange={(e) => setForm({ ...form, saranJurusan: e.target.value })} required />
        <input className="w-full border p-2 rounded" placeholder="Saran karier, pisah koma (mis. Data Scientist, Software Engineer)"
          value={form.saranKarier} onChange={(e) => setForm({ ...form, saranKarier: e.target.value })} required />
        <button type="submit" disabled={creating} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
          {creating ? 'Membuat...' : 'Buat Pemetaan'}
        </button>
      </form>

      <div className="space-y-3">
        {mappings.map((m) => (
          <div key={m.id} className="border rounded p-4">
            <p className="font-medium">{m.skillNode.nama}</p>
            <p className="text-sm text-gray-600">Jurusan: {m.saranJurusan.join(', ')}</p>
            <p className="text-sm text-gray-600">Karier: {m.saranKarier.join(', ')}</p>
          </div>
        ))}
        {mappings.length === 0 && <p className="text-gray-500">Belum ada pemetaan karier.</p>}
      </div>
    </div>
  );
}