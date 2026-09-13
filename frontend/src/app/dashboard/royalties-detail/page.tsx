'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Breakdown {
  contentId: string;
  deskripsi: string | null;
  jumlahPembeli: number;
  pembeli: { id: string; nama: string }[];
  totalPenjualan: number;
  totalKreator: number;
  sudahDibayarSemua: boolean;
}

export default function TutorRoyaltiesDetailPage() {
  const [data, setData] = useState<Breakdown[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/royalties/me/by-content').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Detail Penjualan per Modul</h1>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.contentId} className="border rounded p-4">
            <p className="font-medium">{d.deskripsi || 'Modul'}</p>
            <p className="text-sm text-gray-500">{d.jumlahPembeli} orang membeli · Total Rp{d.totalPenjualan.toLocaleString('id-ID')}</p>
            <p className="text-sm">Bagianmu: Rp{d.totalKreator.toLocaleString('id-ID')} — {d.sudahDibayarSemua ? 'sudah ditransfer admin' : 'menunggu transfer admin'}</p>
          </div>
        ))}
        {data.length === 0 && <p className="text-gray-500">Belum ada penjualan.</p>}
      </div>
    </div>
  );
}