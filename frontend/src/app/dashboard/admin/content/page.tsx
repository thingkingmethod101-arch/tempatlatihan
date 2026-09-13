'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface ContentItem {
  id: string;
  tipe: string;
  judul: string | null;
  statusModerasi: string;
  chapters: { judul: string }[];
}

export default function AdminContentPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  function load() {
    apiFetch('/contents/admin/all').then(setContents).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  async function handleModerate(id: string, statusModerasi: 'disetujui' | 'ditolak') {
    setProcessingId(id);
    try {
      await apiFetch(`/contents/${id}/moderate`, { method: 'PATCH', body: { statusModerasi } });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus modul ini permanen? Semua data terkait (bab, komentar, rating) ikut terhapus.')) return;
    try {
      await apiFetch(`/contents/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal hapus modul');
    }
  }

  async function handleBan(id: string) {
    if (!confirm('Nonaktifkan modul ini? Modul akan hilang dari tampilan publik.')) return;
    try {
      await apiFetch(`/contents/${id}/ban`, { method: 'PATCH' });
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal nonaktifkan');
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Moderasi Konten</h1>
      {message && <p className="text-sm text-red-600 mb-2">{message}</p>}
      <div className="space-y-4">
        {contents.map((c) => (
          <div key={c.id} className="border rounded p-4">
            <div className="flex justify-between items-start">
              <p className="font-medium">{c.judul || c.tipe}</p>
              <span className={
                'text-xs px-2 py-1 rounded ' +
                (c.statusModerasi === 'disetujui' ? 'bg-green-100 text-green-700' :
                 c.statusModerasi === 'ditolak' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')
              }>
                {c.statusModerasi}
              </span>
            </div>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {c.chapters.map((ch, i) => <li key={i}>{ch.judul}</li>)}
            </ul>

            <a href={`/dashboard/my-modules/${c.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                Lihat Isi Modul →
            </a>

            <div className="flex gap-2 mt-2">
              {c.statusModerasi === 'menunggu' && (
                <>
                  <button
                    disabled={processingId === c.id}
                    onClick={() => handleModerate(c.id, 'disetujui')}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    Setujui
                  </button>
                  <button
                    disabled={processingId === c.id}
                    onClick={() => handleModerate(c.id, 'ditolak')}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    Tolak
                  </button>
                </>
              )}
              {c.statusModerasi === 'disetujui' && (
                <button onClick={() => handleBan(c.id)} className="bg-gray-800 text-white px-3 py-1 rounded text-sm">
                  Nonaktifkan
                </button>
              )}
              <button onClick={() => handleDelete(c.id)} className="text-red-600 underline text-sm ml-2">
                Hapus
              </button>
            </div>
          </div>
        ))}
        {contents.length === 0 && <p className="text-gray-500">Belum ada konten.</p>}
      </div>
    </div>
  );
}