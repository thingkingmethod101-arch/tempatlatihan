'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminTutorSiswaPage() {
  const [tutorKontak, setTutorKontak] = useState('');
  const [daftarSiswa, setDaftarSiswa] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const siswaKontakList = daftarSiswa.split('\n').map((s) => s.trim()).filter(Boolean);
      const res = await apiFetch('/talent/admin/link-students', {
        method: 'POST',
        body: { tutorKontak, siswaKontakList },
      });
      setMessage(`Berhasil hubungkan ${res.berhasil} dari ${res.totalDiproses} siswa. ${res.gagal.length > 0 ? `Tidak ditemukan: ${res.gagal.join(', ')}` : ''}`);
      setDaftarSiswa('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal menghubungkan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Hubungkan Siswa ke Tutor</h1>
      <p className="text-sm text-gray-500 mb-4">
        Tutor kirim daftar nomor WA siswanya via WA/email, lalu admin masukkan di sini.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor WA Tutor</label>
          <input className="w-full border p-2 rounded" placeholder="Contoh: 081234567890"
            value={tutorKontak} onChange={(e) => setTutorKontak(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Daftar Nomor WA Siswa (1 per baris)</label>
          <textarea className="w-full border p-2 rounded" rows={8}
            placeholder={"081211112222\n081233334444\n081255556666"}
            value={daftarSiswa} onChange={(e) => setDaftarSiswa(e.target.value)} required />
        </div>
        <button type="submit" disabled={saving} className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50">
          {saving ? 'Memproses...' : 'Hubungkan Siswa'}
        </button>
      </form>
      {message && <p className="text-sm mt-3 bg-blue-50 border border-blue-200 p-2 rounded">{message}</p>}
    </div>
  );
}