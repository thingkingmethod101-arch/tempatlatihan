'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface Application {
  id: string;
  status: string;
  createdAt: string;
  user: { nama: string; kontak: string };
}

export default function AdminScholarshipApplicationsPage() {
  const params = useParams();
  const programId = params.programId as string;

  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  function load() {
    apiFetch(`/scholarship-programs/${programId}/applications`).then(setApplications).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, [programId]);

  async function handleVerify(id: string, status: 'disetujui' | 'ditolak') {
    setProcessingId(id);
    try {
      await apiFetch(`/scholarship-applications/${id}/verify`, { method: 'PATCH', body: { status } });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses');
    } finally {
      setProcessingId(null);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pengajuan Beasiswa</h1>
      <div className="space-y-3">
        {applications.map((a) => (
          <div key={a.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{a.user.nama} ({a.user.kontak})</p>
              <span className={
                'text-xs px-2 py-1 rounded ' +
                (a.status === 'disetujui' ? 'bg-green-100 text-green-700' :
                 a.status === 'ditolak' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')
              }>
                {a.status}
              </span>
            </div>
            {a.status === 'pending' && (
              <div className="flex gap-2">
                <button disabled={processingId === a.id} onClick={() => handleVerify(a.id, 'disetujui')}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
                  Setujui
                </button>
                <button disabled={processingId === a.id} onClick={() => handleVerify(a.id, 'ditolak')}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
                  Tolak
                </button>
              </div>
            )}
          </div>
        ))}
        {applications.length === 0 && <p className="text-gray-500">Belum ada pengajuan.</p>}
      </div>
    </div>
  );
}