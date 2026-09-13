'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface BeritaItem { id: string; judul: string; tag: string | null; isi: string; gambarUrl: string | null; createdAt: string; }

async function uploadFile(file: File, purpose: string): Promise<string> {
  const presign = await apiFetch('/files/presign', { method: 'POST', body: { purpose, mimeType: file.type, sizeBytes: file.size } });
  await fetch(presign.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  const confirmed = await apiFetch('/files/confirm', { method: 'POST', body: { path: presign.path, purpose, mimeType: file.type, sizeBytes: file.size } });
  return confirmed.id;
}

export default function AdminBeritaPage() {
  const [items, setItems] = useState<BeritaItem[]>([]);
  const [judul, setJudul] = useState('');
  const [tag, setTag] = useState('');
  const [isi, setIsi] = useState('');
  const [gambarFileAssetId, setGambarFileAssetId] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    apiFetch('/berita').then(setItems).catch(() => {});
  }
  useEffect(() => { load(); }, []);

  async function handleUploadGambar(file: File) {
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const id = await uploadFile(file, 'berita_gambar');
      setGambarFileAssetId(id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal upload gambar');
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setEditingId(null); setJudul(''); setTag(''); setIsi(''); setGambarFileAssetId(''); setPreviewUrl('');
  }

  function startEdit(item: BeritaItem) {
    setEditingId(item.id);
    setJudul(item.judul); setTag(item.tag ?? ''); setIsi(item.isi);
    setGambarFileAssetId(''); setPreviewUrl(item.gambarUrl ?? '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const body: any = { judul, tag: tag || undefined, isi };
      if (gambarFileAssetId) body.gambarFileAssetId = gambarFileAssetId;
      if (editingId) {
        await apiFetch(`/berita/${editingId}`, { method: 'PATCH', body });
        setMessage('Berita berhasil diperbarui.');
      } else {
        await apiFetch('/berita', { method: 'POST', body });
        setMessage('Berita berhasil dipublikasikan.');
      }
      resetForm();
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal menyimpan berita');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus berita ini?')) return;
    try {
      await apiFetch(`/berita/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal hapus berita');
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Kelola Berita</h1>

      <form onSubmit={handleSubmit} className="border rounded p-4 mb-6 space-y-2">
        <h2 className="font-semibold">{editingId ? 'Edit Berita' : 'Tulis Berita Baru'}</h2>
        <input className="w-full border p-2 rounded" placeholder="Judul berita"
          value={judul} onChange={(e) => setJudul(e.target.value)} required />
        <input className="w-full border p-2 rounded" placeholder="Tag (contoh: Kolaborasi, Hasil Lomba)"
          value={tag} onChange={(e) => setTag(e.target.value)} />
        <textarea className="w-full border p-2 rounded" rows={5} placeholder="Isi berita"
          value={isi} onChange={(e) => setIsi(e.target.value)} required />

        <div>
          <label className="block text-xs text-gray-500 mb-1">Gambar (opsional)</label>
          <input type="file" accept="image/png,image/jpeg"
            onChange={(e) => e.target.files?.[0] && handleUploadGambar(e.target.files[0])}
            disabled={uploading}
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700" />
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Preview" className="mt-2 max-w-xs rounded border" />
          )}
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50">
            {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Publikasikan'}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="text-sm text-gray-600">Batal Edit</button>}
        </div>
        {message && <p className="text-sm">{message}</p>}
      </form>

      <h2 className="font-semibold mb-2">Berita Terbit</h2>
      <div className="space-y-2">
        {items.map((b) => (
          <div key={b.id} className="border rounded p-3 flex justify-between items-start gap-3">
            <div className="flex-1">
              <p className="font-medium text-sm">{b.judul}</p>
              <p className="text-xs text-gray-500">{b.tag} · {new Date(b.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => startEdit(b)} className="text-xs text-blue-600 underline">Edit</button>
              <button onClick={() => handleDelete(b.id)} className="text-xs text-red-600 underline">Hapus</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm">Belum ada berita.</p>}
      </div>
    </div>
  );
}