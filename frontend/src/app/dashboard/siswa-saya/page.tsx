'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Siswa { id: string; nama: string; kontak: string; }
interface TalentItem {
  skillNode: string; akurasi: number; totalSoal: number; ranking: number | null;
  soalSeringSalah: { questionId: string; teks: string | null }[];
}

export default function SiswaSayaPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [laporanId, setLaporanId] = useState<string | null>(null);
  const [laporan, setLaporan] = useState<TalentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/talent/tutor/my-students').then(setSiswaList).catch(() => {});
  }, []);

  async function handleRetrieveLaporan(siswaId: string) {
    setLoading(true);
    setLaporanId(siswaId);
    try {
      const res = await apiFetch(`/talent/tutor/student-report/${siswaId}`);
      setLaporan(res);
    } catch (e) {
      setLaporan([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Siswa Saya</h1>
      <div className="space-y-2 mb-6">
        {siswaList.map((s) => (
          <div key={s.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <p className="font-medium text-sm">{s.nama}</p>
              <p className="text-xs text-gray-500">{s.kontak}</p>
            </div>
            <button onClick={() => handleRetrieveLaporan(s.id)} className="bg-black text-white px-3 py-1 rounded text-sm">
              Retrieve Laporan
            </button>
          </div>
        ))}
        {siswaList.length === 0 && <p className="text-gray-500 text-sm">Belum ada siswa yang dihubungkan. Kirim daftar WA siswamu ke admin.</p>}
      </div>

      {laporanId && (
        <div>
          <h2 className="font-semibold mb-2">Laporan Talenta</h2>
          {loading && <p className="text-sm text-gray-500">Memuat...</p>}
          {!loading && laporan.map((item) => (
            <div key={item.skillNode} className="border rounded p-3 mb-2">
              <div className="flex justify-between">
                <p className="font-medium text-sm">{item.skillNode}</p>
                {item.ranking && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded">#{item.ranking}</span>}
              </div>
              <p className="text-xs text-gray-500">Akurasi: {item.akurasi}% dari {item.totalSoal} soal</p>
              {item.soalSeringSalah.length > 0 && (
                <div className="mt-2 text-xs">
                  <p className="font-medium text-red-600 mb-1">Soal yang sering salah:</p>
                  <ul className="list-disc list-inside text-gray-600">
                    {item.soalSeringSalah.map((s) => (
                      <li key={s.questionId}>{s.teks ?? '(soal bergambar)'}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {!loading && laporan.length === 0 && <p className="text-sm text-gray-500">Belum ada data talenta untuk siswa ini.</p>}
        </div>
      )}
    </div>
  );
}