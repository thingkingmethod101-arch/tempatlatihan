'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function DeleteRequestsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    apiFetch('/contents/admin/delete-requests').then(setItems).catch((e) => setMessage(e.message));
  }
  useEffect(() => { load(); }, []);

  async function handleApprove(id: string) {
    if (!confirm('Setujui penghapusan modul ini secara permanen?')) return;
    try {
      await apiFetch(`/contents/${id}/approve-delete`, { method: 'PATCH' });
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal');
    }
  }

  async function handleReject(id: string) {
    try {
      await apiFetch(`/contents/${id}/reject-delete`, { method: 'PATCH' });
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal');
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Permohonan Hapus Konten</h1>
      {message && <p className="text-sm text-red-600 mb-2">{message}</p>}
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{c.judul || 'Modul Tanpa Judul'}</p>
              <p className="text-xs text-gray-500">Diajukan oleh: {c.owner?.nama} ({c.owner?.kontak})</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleApprove(c.id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">
                Setujui Hapus
              </button>
              <button onClick={() => handleReject(c.id)} className="bg-gray-200 px-3 py-1 rounded text-sm">
                Tolak
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500">Tidak ada permohonan hapus.</p>}
      </div>
    </div>
  );
}