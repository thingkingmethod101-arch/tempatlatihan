'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

async function uploadFile(file: File, purpose: string): Promise<string> {
  const presign = await apiFetch('/files/presign', { method: 'POST', body: { purpose, mimeType: file.type, sizeBytes: file.size } });
  await fetch(presign.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  const confirmed = await apiFetch('/files/confirm', { method: 'POST', body: { path: presign.path, purpose, mimeType: file.type, sizeBytes: file.size } });
  return confirmed.id;
}

const SLOTS: { key: 'heroImageId' | 'testImageId' | 'galleryImageId'; label: string; keterangan: string }[] = [
  { key: 'heroImageId', label: 'Gambar Hero (Beranda Landing)', keterangan: 'Gambar besar di bagian paling atas landing page.' },
  { key: 'testImageId', label: 'Gambar Ilustrasi Tes Potensi', keterangan: 'Gambar di kartu ajakan Tes Potensi.' },
  { key: 'galleryImageId', label: 'Gambar Galeri & Testimoni', keterangan: 'Foto testimoni yang tampil memanjang di bagian galeri.' },
];

export default function LandingSettingsPage() {
  const [current, setCurrent] = useState<{ heroImageUrl: string | null; testImageUrl: string | null; galleryImageUrl: string | null } | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    apiFetch('/landing-settings').then(setCurrent).catch(() => {});
  }
  useEffect(() => { load(); }, []);

  async function handleUpload(key: string, file: File) {
    setUploadingKey(key);
    setMessage(null);
    try {
      const id = await uploadFile(file, 'landing_image');
      await apiFetch('/landing-settings', { method: 'PATCH', body: { [key]: id } });
      setMessage('Gambar berhasil diperbarui.');
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal upload gambar');
    } finally {
      setUploadingKey(null);
    }
  }

  if (!current) return <p>Memuat...</p>;

  const urlMap: Record<string, string | null> = {
    heroImageId: current.heroImageUrl,
    testImageId: current.testImageUrl,
    galleryImageId: current.galleryImageUrl,
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Gambar Landing Page</h1>
      {message && <p className="text-sm mb-4 bg-blue-50 border border-blue-200 p-2 rounded">{message}</p>}

      <div className="space-y-6">
        {SLOTS.map((slot) => (
          <div key={slot.key} className="border rounded p-4">
            <p className="font-semibold text-sm">{slot.label}</p>
            <p className="text-xs text-gray-500 mb-2">{slot.keterangan}</p>
            {urlMap[slot.key] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlMap[slot.key]!} alt={slot.label} className="w-full max-w-sm rounded border mb-2" />
            )}
            <input type="file" accept="image/png,image/jpeg"
              onChange={(e) => e.target.files?.[0] && handleUpload(slot.key, e.target.files[0])}
              disabled={uploadingKey === slot.key}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700" />
            {uploadingKey === slot.key && <p className="text-xs text-orange-600 mt-1">Sedang upload...</p>}
          </div>
        ))}
      </div>
    </div>
  );
}