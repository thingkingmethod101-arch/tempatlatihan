'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Buyer { id: string; nama: string; }
interface Breakdown {
  contentId: string;
  namaTutor: string;
  kontakTutor: string;
  infoRekening: string | null;
  deskripsi: string | null;
  jumlahPembeli: number;
  pembeli: Buyer[];
  totalPenjualan: number;
  totalKreator: number;
  totalPlatform: number;
  sudahDibayarSemua: boolean;
}

export default function AdminRoyaltiesPage() {
  const [data, setData] = useState<Breakdown[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  function load() {
    apiFetch('/royalties/admin/by-content').then(setData).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  async function handlePayout(contentId: string) {
    if (!confirm('Konfirmasi: kamu sudah benar-benar transfer uang ke tutor untuk modul ini?')) return;
    setProcessingId(contentId);
    try {
      await apiFetch(`/royalties/admin/payout/${contentId}`, { method: 'POST' });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal memproses payout');
    } finally {
      setProcessingId(null);
    }
  }

  function buatLinkWaTutor(kontak: string, namaModul: string, jumlahRupiah: number) {
    const pesan = `Halo, saya dari admin tempatlatihan.com. Ingin konfirmasi pencairan royalti untuk modul "${namaModul}" sebesar Rp${jumlahRupiah.toLocaleString('id-ID')}. Mohon konfirmasi info rekening kamu masih sama seperti yang terdaftar ya. Terima kasih.`;
    return `https://wa.me/${kontak.replace(/\D/g, '')}?text=${encodeURIComponent(pesan)}`;
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Detail Royalti per Modul</h1>
      <p className="text-sm text-gray-500 mb-4">
        Angka di bawah murni hasil split 70/30 dari harga jual. Perhitungan pajak (PPN, dll.) tidak dihitung otomatis
        di sini — sebaiknya dibahas dengan akuntan/konsultan pajak kalian sendiri menggunakan data ini sebagai acuan.
      </p>
      <div className="space-y-4">
        {data.map((d) => (
          <div key={d.contentId} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{d.deskripsi || `Modul oleh ${d.namaTutor}`}</p>
                <p className="text-sm text-gray-500">Tutor: {d.namaTutor}</p>
              </div>
              <span className={
                'text-xs px-2 py-1 rounded ' +
                (d.sudahDibayarSemua ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700')
              }>
                {d.sudahDibayarSemua ? 'Sudah dibayar' : 'Belum dibayar'}
              </span>
            </div>

            <table className="w-full text-sm mt-3">
              <tbody>
                <tr><td className="text-gray-500 py-1">Jumlah Pembeli</td><td className="text-right">{d.jumlahPembeli} orang</td></tr>
                <tr><td className="text-gray-500 py-1">Total Penjualan</td><td className="text-right">Rp{d.totalPenjualan.toLocaleString('id-ID')}</td></tr>
                <tr><td className="text-gray-500 py-1">Bagian Tutor (70%)</td><td className="text-right">Rp{d.totalKreator.toLocaleString('id-ID')}</td></tr>
                <tr><td className="text-gray-500 py-1">Bagian Platform (30%)</td><td className="text-right">Rp{d.totalPlatform.toLocaleString('id-ID')}</td></tr>
              </tbody>
            </table>

            <div className="mt-3 bg-gray-50 border rounded p-2">
              <p className="text-xs text-gray-500">Info Rekening Tutor:</p>
              <p className="text-sm font-medium">{d.infoRekening || 'Belum diisi tutor'}</p>
              {d.nomorRekening && <p className="text-sm font-medium">No. Rek: {d.nomorRekening}</p>}
            </div>

            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Pembeli:</p>
              <div className="flex flex-wrap gap-2">
                {d.pembeli.map((p) => (
                  <Link key={p.id} href={`/dashboard/admin/users/${p.id}`}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
                    {p.nama}
                  </Link>
                ))}
              </div>
            </div>

            {!d.sudahDibayarSemua && (
              <div className="flex gap-2 mt-3">
                <button
                  disabled={processingId === d.contentId}
                  onClick={() => handlePayout(d.contentId)}
                  className="bg-black text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                >
                  {processingId === d.contentId ? 'Memproses...' : 'Tandai Sudah Dibayar ke Tutor'}
                </button>
                <a
                  href={buatLinkWaTutor(d.kontakTutor, d.deskripsi || d.namaTutor, d.totalKreator)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                >
                  Chat WA Tutor
                </a>
              </div>
            )}
          </div>
        ))}
        {data.length === 0 && <p className="text-gray-500">Belum ada penjualan modul.</p>}
      </div>
    </div>
  );
}