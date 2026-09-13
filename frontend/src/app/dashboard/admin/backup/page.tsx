'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/maintenance/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal mengunduh backup');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal mengunduh');
    } finally {
      setDownloading(false);
    }
  }

  async function handleCleanupNow() {
    if (!confirm('Jalankan pembersihan sekarang? Ini akan menghapus bukti pembayaran lama (>3 bulan) dan konten/soal yang ditolak (>30 hari).')) return;
    setCleaning(true);
    setMessage(null);
    try {
      const res = await apiFetch('/maintenance/run-cleanup', { method: 'POST' });
      setMessage(`Selesai. Bukti dibersihkan: ${res.bukti.ledgerDibersihkan + res.bukti.transaksiDibersihkan}, Konten/soal dihapus: ${res.konten.kontenDihapus + res.konten.soalDihapus}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal menjalankan pembersihan');
    } finally {
      setCleaning(false);
    }
  }

  async function handleResetDatabase() {
    const konfirmasi1 = confirm('PERINGATAN: Ini akan menghapus SEMUA akun (kecuali admin), modul, event, transaksi, dan data lainnya secara PERMANEN. Yakin?');
    if (!konfirmasi1) return;
    const konfirmasi2 = confirm('Konfirmasi sekali lagi — apakah kamu SUDAH BACKUP data terlebih dahulu? Klik OK cuma kalau sudah yakin 100%.');
    if (!konfirmasi2) return;

    setResetting(true);
    setMessage(null);
    try {
      const res = await apiFetch('/maintenance/reset-database', { method: 'POST' });
      setMessage(`Database berhasil direset. ${res.akunTerhapus} akun terhapus.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal reset database');
    } finally {
      setResetting(false);
    }
  }


  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Backup & Pembersihan Data</h1>

      <div className="border rounded p-4 mb-4">
        <h2 className="font-semibold mb-2">Unduh Backup Data</h2>
        <p className="text-sm text-gray-500 mb-3">
          Berisi data akun, event, transaksi, modul, dan sertifikat dalam format JSON. Simpan berkala untuk jaga-jaga
          kalau perlu pindah server.
        </p>
        <button onClick={handleDownload} disabled={downloading} className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50">
          {downloading ? 'Mengunduh...' : 'Unduh Backup (JSON)'}
        </button>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Pembersihan Otomatis</h2>
        <p className="text-sm text-gray-500 mb-3">
          Berjalan otomatis tiap 3 bulan (Jan/Apr/Jul/Okt). Bisa juga dijalankan manual sekarang untuk testing.
        </p>
        <button onClick={handleCleanupNow} disabled={cleaning} className="bg-red-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
          {cleaning ? 'Memproses...' : 'Jalankan Pembersihan Sekarang'}
        </button>
      </div>

      <div className="border-2 border-red-300 rounded p-4 mt-4">
        <h2 className="font-semibold mb-2 text-red-700">Zona Berbahaya — Reset Database</h2>
        <p className="text-sm text-gray-500 mb-3">
          Menghapus SEMUA akun (kecuali admin), modul, event, transaksi, soal, dan data terkait lainnya secara permanen.
          Skill Node, Tier, dan Sekolah TETAP ADA. Tidak bisa dibatalkan — pastikan sudah backup dulu.
        </p>
        <button onClick={handleResetDatabase} disabled={resetting} className="bg-red-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
          {resetting ? 'Memproses...' : 'Reset Database Sekarang'}
        </button>
      </div>

      {message && <p className="text-sm mt-4 bg-blue-50 border border-blue-200 p-2 rounded">{message}</p>}
    </div>
  );
}