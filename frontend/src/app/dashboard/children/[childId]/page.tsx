'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface TalentItem {
  skillNode: string;
  akurasi: string;
  totalSoal: number;
  ranking: number | null;
}

interface Certificate {
  id: string;
  nomorSertifikat: string;
  eventRegistration: { event: { nama: string } };
}

export default function ChildProgressPage() {
  const params = useParams();
  const childId = params.childId as string;

  const [talent, setTalent] = useState<TalentItem[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/parent-links/children/${childId}/talent`).then(setTalent).catch((e) => setError(e.message));
    apiFetch(`/parent-links/children/${childId}/certificates`).then(setCerts).catch(() => {});
  }, [childId]);

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Progres Anak</h1>

      <h2 className="font-semibold mb-2">Pemetaan Talenta</h2>
      <div className="space-y-3 mb-6">
        {talent.map((item) => (
          <div key={item.skillNode} className="border rounded p-3">
            <div className="flex justify-between">
              <span className="font-medium">{item.skillNode}</span>
              {item.ranking && <span className="text-xs bg-yellow-100 px-2 py-1 rounded">Ranking #{item.ranking}</span>}
            </div>
            <p className="text-sm text-gray-600">Akurasi {item.akurasi}% dari {item.totalSoal} soal</p>
          </div>
        ))}
        {talent.length === 0 && <p className="text-gray-500 text-sm">Belum ada data talenta.</p>}
      </div>

      <h2 className="font-semibold mb-2">Sertifikat</h2>
      <div className="space-y-2">
        {certs.map((cert) => (
          <div key={cert.id} className="border rounded p-3">
            <p className="font-medium">{cert.eventRegistration.event.nama}</p>
            <p className="text-xs text-gray-500">{cert.nomorSertifikat}</p>
          </div>
        ))}
        {certs.length === 0 && <p className="text-gray-500 text-sm">Belum ada sertifikat.</p>}
      </div>
    </div>
  );
}