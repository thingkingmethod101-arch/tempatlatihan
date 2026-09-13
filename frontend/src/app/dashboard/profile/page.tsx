'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Profile {
  id: string;
  namaLengkap: string;
  jenjangPendidikanTerakhir: string;
  statusVerifikasi: string;
  catatanVerifikasi: string | null;
  dokumenKtpFileAssetId: string | null;
  dokumenIjazahFileAssetId: string | null;
  dokumenCvFileAssetId: string | null;
  infoRekening: string | null;
  nomorRekening: string | null;
}

async function uploadDocument(file: File, purpose: 'ktp' | 'ijazah' | 'cv'): Promise<string> {
  const presign = await apiFetch('/files/presign', {
    method: 'POST',
    body: { purpose, mimeType: file.type, sizeBytes: file.size },
  });

  await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  const confirmed = await apiFetch('/files/confirm', {
    method: 'POST',
    body: { path: presign.path, purpose, mimeType: file.type, sizeBytes: file.size },
  });

  return confirmed.id;
}


export default function TutorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'ktp' | 'ijazah' | 'cv' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [infoRekening, setInfoRekening] = useState('');
  const [nomorRekening, setNomorRekening] = useState('');
  const [savingBankInfo, setSavingBankInfo] = useState(false);
  const [tier, setTier] = useState<{ totalPenjualanSemua: number; tier: 'gold' | 'silver' | null } | null>(null);

  useEffect(() => {
    apiFetch('/royalties/me/tier').then(setTier).catch(() => {});
  }, []);

  function load() {
    apiFetch('/tutor-profiles/me').then(setProfile).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (profile?.infoRekening) setInfoRekening(profile.infoRekening);
    if (profile?.nomorRekening) setNomorRekening(profile.nomorRekening);
  }, [profile]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, purpose: 'ktp' | 'ijazah' | 'cv') {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(purpose);
    setMessage(null);
    try {
      const fileAssetId = await uploadDocument(file, purpose);
      const field = purpose === 'ktp' ? 'dokumenKtpFileAssetId' : purpose === 'ijazah' ? 'dokumenIjazahFileAssetId' : 'dokumenCvFileAssetId';
      await apiFetch('/tutor-profiles/me/documents', { method: 'PATCH', body: { [field]: fileAssetId } });
      setMessage(`Dokumen ${purpose.toUpperCase()} berhasil diupload.`);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal upload dokumen (cek apakah storage provider sudah dikonfigurasi)');
    } finally {
      setUploading(null);
    }
  }

  async function handleSaveBankInfo() {
    setSavingBankInfo(true);
    try {
      await apiFetch('/tutor-profiles/me/bank-info', { method: 'PATCH', body: { infoRekening, nomorRekening } });
      setMessage('Info rekening berhasil disimpan.');
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal simpan info rekening');
    } finally {
      setSavingBankInfo(false);
    }
  }

  async function handleResubmit() {
    if (!confirm('Ajukan verifikasi ulang? Pastikan dokumen sudah kamu lengkapi/revisi terlebih dahulu.')) return;
    try {
      await apiFetch('/tutor-profiles/me/resubmit', { method: 'PATCH' });
      setMessage('Berhasil diajukan ulang, menunggu verifikasi admin.');
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal mengajukan ulang');
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!profile) return <p>Memuat...</p>;

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-4">Profil Tutor</h1>
      <div className="border rounded p-4 mb-4">
      <p>Masukkan ID KTP.pdf, Ijasah.pdf dan CV.pdf anda MAX 2MB. Tim administrasi kami akan menilai kelengkapan dan keotentikan dokumen anda.</p>
      </div>
      <div className="border rounded p-4 mb-4">
        <p><b>Nama:</b> {profile.namaLengkap}</p>
        <p><b>Pendidikan:</b> {profile.jenjangPendidikanTerakhir}</p>
        <p>
          <b>Status:</b>{' '}
          <span className={
            'text-xs px-2 py-1 rounded ' +
            (profile.statusVerifikasi === 'disetujui' ? 'bg-green-100 text-green-700' :
             profile.statusVerifikasi === 'ditolak' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')
          }>
            {profile.statusVerifikasi}
          </span>
          {profile.statusVerifikasi === 'disetujui' && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
              Terverifikasi
            </span>
          )}
          {tier?.tier === 'gold' && (
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold border border-yellow-400">
              GOLD
            </span>
          )}
          {tier?.tier === 'silver' && (
            <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-bold border border-gray-400">
              SILVER
            </span>
          )}
        </p>
        {tier && (
          <p className="text-xs text-gray-400 mt-1">
            Total nilai penjualan modulmu: Rp{tier.totalPenjualanSemua.toLocaleString('id-ID')}
          </p>
        )}
        {profile.catatanVerifikasi && (
          <p className="text-sm text-gray-500 mt-1">Catatan admin: {profile.catatanVerifikasi}</p>
        )}
        {profile.statusVerifikasi === 'ditolak' && (
          <button
            onClick={handleResubmit}
            className="mt-2 bg-blue-600 text-white px-4 py-1.5 rounded text-sm"
          >
            Ajukan Verifikasi Ulang
          </button>
        )}
      </div>

      <div className="border rounded p-4 mb-4">
        <label className="block font-medium mb-2">Info Rekening untuk Pencairan Royalti</label>

        <label className="block text-xs text-gray-500 mb-1">Nama Pemilik & Bank</label>
        <input
          className="w-full border p-2 rounded text-sm mb-3"
          placeholder="Contoh: BCA a.n. Budi Santoso"
          value={infoRekening}
          onChange={(e) => setInfoRekening(e.target.value)}
        />

        <label className="block text-xs text-gray-500 mb-1">Nomor Rekening</label>
        <input
          className="w-full border p-2 rounded text-sm"
          placeholder="Contoh: 1234567890"
          value={nomorRekening}
          onChange={(e) => setNomorRekening(e.target.value)}
        />

        <button
          onClick={handleSaveBankInfo}
          disabled={savingBankInfo}
          className="mt-3 bg-black text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
        >
          {savingBankInfo ? 'Menyimpan...' : 'Simpan Info Rekening'}
        </button>
      </div>

      {message && <p className="text-sm text-blue-700 mb-4">{message}</p>}
      <div>Pastikan ada tulisan: ✓ Sudah diupload !</div>
      <div className="border rounded p-4 mb-3">
        <p className="font-medium mb-2">
          Dokumen KTP <span className="text-red-600">*</span>{' '}
          {profile.dokumenKtpFileAssetId && <span className="text-green-600">✓ Sudah diupload</span>}
        </p>
        <input type="file" accept="image/jpeg,image/png,application/pdf"
          onChange={(e) => handleUpload(e, 'ktp')} disabled={uploading === 'ktp'}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700" />
        {uploading === 'ktp' && <p className="text-xs text-orange-600 mt-1">Sedang upload, harap bersabar...</p>}
      </div>

      <div className="border rounded p-4">
        <p className="font-medium mb-2">
          Dokumen Ijazah <span className="text-red-600">*</span>{' '}
          {profile.dokumenIjazahFileAssetId && <span className="text-green-600">✓ Sudah diupload</span>}
        </p>
        <input type="file" accept="image/jpeg,image/png,application/pdf"
          onChange={(e) => handleUpload(e, 'ijazah')} disabled={uploading === 'ijazah'}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700" />
        {uploading === 'ijazah' && <p className="text-xs text-orange-600 mt-1">Sedang upload, harap bersabar...</p>}
      </div>

      <div className="border rounded p-4">
        <p className="font-medium mb-2">
          CV (Curriculum Vitae)/Riwayat Pekerjaan <span className="text-red-600">*</span>{' '}
          {profile.dokumenCvFileAssetId && <span className="text-green-600">Sudah diupload</span>}
        </p>
        <input type="file" accept="application/pdf"
          onChange={(e) => handleUpload(e, 'cv')} disabled={uploading === 'cv'}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700" />
        <p className="text-xs text-gray-400 mt-1">Format PDF saja</p>
        {uploading === 'cv' && <p className="text-xs text-orange-600 mt-1">Sedang upload, harap bersabar...</p>}
      </div>

      {profile.statusVerifikasi === 'pending' && (
        <p className="text-sm text-gray-500 mt-4">
          Upload semua dokumen-dokumen di atas, lalu tunggu admin memverifikasi sebelum kamu bisa jual konten.
        </p>
      )}
    </div>
  );
}