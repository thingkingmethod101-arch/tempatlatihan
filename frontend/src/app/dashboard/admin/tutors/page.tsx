'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface TutorProfile {
  id: string;
  namaLengkap: string;
  jenjangPendidikanTerakhir: string;
  statusVerifikasi: string;
  user: { nama: string; kontak: string };
}

interface DocUrls {
  ktpUrl: string | null;
  ijazahUrl: string | null;
  cvUrl: string | null;
}

export default function AdminTutorsPage() {
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loadingDocsId, setLoadingDocsId] = useState<string | null>(null);
  const [openDocsId, setOpenDocsId] = useState<string | null>(null);
  const [docUrls, setDocUrls] = useState<DocUrls | null>(null);

  function load() {
    apiFetch('/tutor-profiles').then(setTutors).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  async function handleVerify(id: string, keputusan: 'disetujui' | 'ditolak') {
    setProcessingId(id);
    try {
      await apiFetch(`/tutor-profiles/${id}/verify`, { method: 'PATCH', body: { keputusan } });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleToggleLihatDokumen(id: string) {
    if (openDocsId === id) {
      setOpenDocsId(null);
      setDocUrls(null);
      return;
    }
    setLoadingDocsId(id);
    try {
      const res = await apiFetch(`/tutor-profiles/${id}/documents`);
      setDocUrls(res);
      setOpenDocsId(id);
    } catch (e) {
      alert('Gagal memuat dokumen: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setLoadingDocsId(null);
    }
  }

  async function handleDeleteDocument(tutorId: string, jenis: 'ktp' | 'ijazah' | 'cv') {
    if (!confirm(`Hapus dokumen ${jenis.toUpperCase()} tutor ini?`)) return;
    try {
      await apiFetch(`/tutor-profiles/${tutorId}/documents/${jenis}`, { method: 'PATCH' });
      handleToggleLihatDokumen(tutorId);
      setTimeout(() => handleToggleLihatDokumen(tutorId), 100);
    } catch (e) {
      alert('Gagal hapus dokumen');
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Verifikasi Tutor</h1>
      <div className="space-y-3">
        {tutors.map((t) => (
          <div key={t.id} className="border rounded p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{t.namaLengkap} ({t.user.nama})</p>
                <p className="text-sm text-gray-500">{t.user.kontak} · {t.jenjangPendidikanTerakhir}</p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={loadingDocsId === t.id}
                  onClick={() => handleToggleLihatDokumen(t.id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                >
                  {loadingDocsId === t.id ? 'Memuat...' : openDocsId === t.id ? 'Tutup Dokumen' : 'Lihat Dokumen'}
                </button>
                <button
                  disabled={processingId === t.id}
                  onClick={() => handleVerify(t.id, 'disetujui')}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                >
                  Setujui
                </button>
                <button
                  disabled={processingId === t.id}
                  onClick={() => handleVerify(t.id, 'ditolak')}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                >
                  Tolak
                </button>
              </div>
            </div>

            {openDocsId === t.id && docUrls && (
              <div className="mt-3 pt-3 border-t flex gap-3 flex-wrap">
              {docUrls.ktpUrl ? (
                <div className="flex items-center gap-1">
                  <a href={docUrls.ktpUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded">
                    Buka KTP
                  </a>
                  <button onClick={() => handleDeleteDocument(t.id, 'ktp')} className="text-xs text-red-600 underline">
                    Hapus
                  </button>
                </div>
              ) : <span className="text-sm text-gray-400">KTP belum diupload</span>}

              {docUrls.ijazahUrl ? (
                <div className="flex items-center gap-1">
                  <a href={docUrls.ijazahUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded">
                    Buka Ijazah
                  </a>
                  <button onClick={() => handleDeleteDocument(t.id, 'ijazah')} className="text-xs text-red-600 underline">
                    Hapus
                  </button>
                </div>
              ) : <span className="text-sm text-gray-400">Ijazah belum diupload</span>}

              {docUrls.cvUrl ? (
                <div className="flex items-center gap-1">
                  <a href={docUrls.cvUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded">
                    Buka CV
                  </a>
                  <button onClick={() => handleDeleteDocument(t.id, 'cv')} className="text-xs text-red-600 underline">
                    Hapus
                  </button>
                </div>
              ) : <span className="text-sm text-gray-400">CV belum diupload</span>}
            </div>
            )}
          </div>
        ))}
        {tutors.length === 0 && <p className="text-gray-500">Tidak ada tutor menunggu verifikasi.</p>}
      </div>
    </div>
  );
}