'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface LinkItem {
  id: string;
  status: string;
  child?: { id: string; nama: string; kontak: string };
}

export default function ParentLinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [childKontak, setChildKontak] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function loadLinks() {
    apiFetch('/parent-links/me').then(setLinks).catch((e) => setError(e.message));
  }

  useEffect(() => { loadLinks(); }, []);

  async function handleRequestLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await apiFetch('/parent-links', { method: 'POST', body: { childKontak } });
      setMessage('Permintaan link terkirim! Menunggu anak menyetujui.');
      setChildKontak('');
      loadLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim permintaan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Hubungkan Akun Anak</h1>

      <form onSubmit={handleRequestLink} className="flex gap-2 mb-6 max-w-md">
        <input
          className="flex-1 border p-2 rounded"
          placeholder="Email akun anak"
          value={childKontak}
          onChange={(e) => setChildKontak(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? '...' : 'Ajukan'}
        </button>
      </form>

      {message && <p className="text-sm text-green-700 mb-4">{message}</p>}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <h2 className="font-semibold mb-2">Status Link</h2>
      <div className="space-y-2">
        {links.map((link) => (
          <div key={link.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{link.child?.nama}</p>
              <p className="text-sm text-gray-500">{link.child?.kontak}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={
                  'text-xs px-2 py-1 rounded ' +
                  (link.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : link.status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700')
                }
              >
                {link.status}
              </span>
              {link.status === 'approved' && link.child && (
                <Link href={`/dashboard/children/${link.child.id}`} className="text-blue-600 underline text-sm">
                  Lihat Progres
                </Link>
              )}
            </div>
          </div>
        ))}
        {links.length === 0 && <p className="text-gray-500 text-sm">Belum ada link yang diajukan.</p>}
      </div>
    </div>
  );
}