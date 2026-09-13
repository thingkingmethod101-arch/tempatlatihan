'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function PsychTestSettingsPage() {
  const [harga, setHarga] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/psych-test/settings').then((s) => setHarga(s.harga)).catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch('/psych-test/settings', { method: 'PATCH', body: { harga } });
      setMessage('Harga berhasil disimpan.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal simpan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-4">Harga Tes Psikometri Berbayar</h1>
      <p className="text-sm text-gray-500 mb-4">
        Siswa dapat 1x kerjakan tes gratis (versi singkat). Setelah itu, kalau mau ulang dengan versi lebih lengkap
        dan hasil lebih presisi, mereka perlu bayar sesuai harga ini.
      </p>
      <div className="border rounded p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Harga (Rp)</label>
        <input type="number" className="w-full border p-2 rounded"
          value={harga === 0 ? '' : harga}
          onChange={(e) => setHarga(e.target.value === '' ? 0 : Number(e.target.value))} />
        <button onClick={handleSave} disabled={saving} className="mt-3 bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50">
          {saving ? 'Menyimpan...' : 'Simpan Harga'}
        </button>
        {message && <p className="text-sm mt-2">{message}</p>}
      </div>
    </div>
  );
}