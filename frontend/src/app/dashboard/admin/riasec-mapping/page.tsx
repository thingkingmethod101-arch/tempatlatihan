'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Mapping { id: string; kombinasi: string; saranJurusan: string; saranKarir: string; }

export default function RiasecMappingPage() {
  const [items, setItems] = useState<Mapping[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [kombinasi, setKombinasi] = useState('');
  const [saranJurusan, setSaranJurusan] = useState('');
  const [saranKarir, setSaranKarir] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    apiFetch('/riasec-mapping').then(setItems).catch(() => {});
  }
  useEffect(() => { load(); }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await apiFetch('/riasec-mapping/bulk-upload', { method: 'POST', body: parsed });
      setMessage(`Berhasil: ${res.berhasil} dari ${res.totalDiproses} baris. ${res.gagal.length > 0 ? `Gagal: ${res.gagal.length} baris.` : ''}`);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? `Gagal: ${err.message}` : 'File JSON tidak valid atau gagal diproses.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/riasec-mapping', { method: 'POST', body: { kombinasi, saranJurusan, saranKarir } });
      setKombinasi(''); setSaranJurusan(''); setSaranKarir('');
      setMessage('Kombinasi berhasil disimpan.');
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal simpan');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus kombinasi ini?')) return;
    await apiFetch(`/riasec-mapping/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Tabel Kombinasi RIASEC</h1>
      <p className="text-sm text-gray-500 mb-4">
        Sistem otomatis mencocokkan 2 huruf skor tertinggi siswa ke tabel ini untuk kasih saran jurusan & karier.
      </p>

      <div className="border rounded p-4 mb-4">
        <h2 className="font-semibold mb-2">Upload Sekaligus (File JSON)</h2>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileUpload} disabled={uploading}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700" />
        <p className="text-xs text-gray-400 mt-2">
          Format: [{'{'}"kombinasi": "RI", "saranJurusan": "...", "saranKarir": "..."{'}'}, ...]
        </p>
      </div>

      <form onSubmit={handleManualSubmit} className="border rounded p-4 mb-6 space-y-2">
        <h2 className="font-semibold mb-2">Tambah Manual (1 per Submit)</h2>
        <input className="w-full border p-2 rounded text-sm" placeholder="Kombinasi 2 huruf (contoh: RI)"
          value={kombinasi} onChange={(e) => setKombinasi(e.target.value)} maxLength={2} required />
        <input className="w-full border p-2 rounded text-sm" placeholder="Saran Jurusan (pisah koma)"
          value={saranJurusan} onChange={(e) => setSaranJurusan(e.target.value)} required />
        <input className="w-full border p-2 rounded text-sm" placeholder="Saran Karier (pisah koma)"
          value={saranKarir} onChange={(e) => setSaranKarir(e.target.value)} required />
        <button type="submit" disabled={saving} className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50">
          {saving ? 'Menyimpan...' : 'Simpan Kombinasi'}
        </button>
      </form>

      {message && <p className="text-sm mb-4 bg-blue-50 border border-blue-200 p-2 rounded">{message}</p>}

      <h2 className="font-semibold mb-2">Kombinasi Tersimpan ({items.length})</h2>
      <div className="space-y-2">
        {items.map((m) => (
          <div key={m.id} className="border rounded p-3 text-sm">
            <div className="flex justify-between items-start">
              <b className="text-blue-700">{m.kombinasi}</b>
              <button onClick={() => handleDelete(m.id)} className="text-xs text-red-600 underline">Hapus</button>
            </div>
            <p className="text-gray-600 mt-1"><b>Jurusan:</b> {m.saranJurusan}</p>
            <p className="text-gray-600"><b>Karier:</b> {m.saranKarir}</p>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm">Belum ada data. Upload JSON atau isi manual di atas.</p>}
      </div>
    </div>
  );
}