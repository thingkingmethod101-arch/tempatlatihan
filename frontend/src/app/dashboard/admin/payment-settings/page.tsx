'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

async function uploadFile(file: File, purpose: string): Promise<string> {
  const presign = await apiFetch('/files/presign', { method: 'POST', body: { purpose, mimeType: file.type, sizeBytes: file.size } });
  await fetch(presign.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  const confirmed = await apiFetch('/files/confirm', { method: 'POST', body: { path: presign.path, purpose, mimeType: file.type, sizeBytes: file.size } });
  return confirmed.id;
}

export default function PaymentSettingsPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadCurrent() {
    const settings = await apiFetch('/payment-settings').catch(() => null);
    if (settings?.qrisFileAssetId) {
      const signed = await apiFetch(`/files/${settings.qrisFileAssetId}/signed-url`).catch(() => null);
      setCurrentUrl(signed?.url ?? null);
    }
  }

  useEffect(() => { loadCurrent(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    setMessage(null);
    try {
      const id = await uploadFile(file, 'qris_admin');
      await apiFetch('/payment-settings', { method: 'PATCH', body: { qrisFileAssetId: id } });
      setMessage('QRIS berhasil diperbarui.');
      loadCurrent();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal upload QRIS');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-4">Pengaturan QRIS</h1>
      <p className="text-sm text-gray-500 mb-4">Gambar ini akan tampil ke siswa/orang tua/tutor saat mereka checkout.</p>

      {currentUrl && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-1">QRIS saat ini:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentUrl} alt="QRIS aktif" className="w-64 border rounded" />
        </div>
      )}

      <input type="file" accept="image/png,image/jpeg" onChange={handleUpload} disabled={uploading}
        className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700" />
      {uploading && <p className="text-xs text-orange-600 mt-1">Sedang upload, harap bersabar...</p>}
      {previewUrl && (
        <div className="mt-3">
          <p className="text-sm text-gray-500">Preview baru:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Preview QRIS baru" className="w-64 border rounded" />
        </div>
      )}
      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  );
}