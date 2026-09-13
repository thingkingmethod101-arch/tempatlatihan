'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface RoyaltyEntry {
  id: string;
  amount: string;
  tipe: string;
  content: { tipe: string; deskripsi?: string | null };
  payoutId: string | null;
}

const NOMOR_WA_ADMIN = '6282322196419';

export default function RoyaltiesPage() {
  const [total, setTotal] = useState(0);
  const [entries, setEntries] = useState<RoyaltyEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/royalties/me')
      .then((data) => {
        setTotal(data.total);
        setEntries(data.entries);
      })
      .catch((e) => setError(e.message));
  }, []);

  const belumDibayar = entries.filter((e) => !e.payoutId);
  const totalBelumDibayar = belumDibayar.reduce((sum, e) => sum + Number(e.amount), 0);

  function linkWaAdmin() {
    const pesan = `Halo Admin Tempat Latihan.com, saya ingin menanyakan status pencairan royalti saya. Total pendapatan yang belum dibayar sekitar Rp${totalBelumDibayar.toLocaleString('id-ID')}. Mohon info lebih lanjut. Terima kasih.`;
    return `https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`;
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pendapatan Royalti</h1>
      <div className="border rounded p-4 mb-4">
        <p className="text-sm text-gray-500">Total pendapatan (semua waktu)</p>
        <p className="text-3xl font-bold">Rp{total.toLocaleString('id-ID')}</p>
      </div>

      {totalBelumDibayar > 0 && (
        <div className="border rounded p-4 mb-6 bg-yellow-50 border-yellow-200">
          <p className="text-sm text-gray-600 mb-2">
            Ada <b>Rp{totalBelumDibayar.toLocaleString('id-ID')}</b> yang belum dicairkan.
            Pastikan info rekening kamu sudah diisi di halaman Profil Tutor.
          </p>
          <a
            href={linkWaAdmin()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded text-sm"
          >
            Chat WA Admin soal Pencairan
          </a>
        </div>

      )}

      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <span className="text-sm">{e.content.deskripsi || e.content.tipe} · {e.tipe}</span>
              {!e.payoutId && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Belum dibayar</span>}
            </div>
            <span className="font-medium">Rp{Number(e.amount).toLocaleString('id-ID')}</span>
          </div>
        ))}
        {entries.length === 0 && <p className="text-gray-500 text-sm">Belum ada pendapatan.</p>}
      </div>
    </div>
  );
}