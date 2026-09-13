'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function VerifikasiPsikotesPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<{ nama: string; tanggal: string; tipeTes: string } | null | 'loading'>('loading');

  useEffect(() => {
    apiFetch(`/psych-test/verify/${id}`, { auth: false }).then(setData).catch(() => setData(null));
  }, [id]);

  if (data === 'loading') return <p style={{ padding: 40, textAlign: 'center' }}>Memeriksa...</p>;

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: 24, textAlign: 'center' }}>
      {data ? (
        <div style={{ border: '2px solid #0E9C82', borderRadius: 12, padding: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0E9C82', marginBottom: 12 }}>Sertifikat Valid</h1>
          <p style={{ fontSize: 14, marginBottom: 4 }}><b>Nama:</b> {data.nama}</p>
          <p style={{ fontSize: 14, marginBottom: 4 }}>
            <b>Jenis:</b> Tes Psikometri RIASEC {data.tipeTes === 'berbayar' ? '(Versi Komprehensif)' : '(Versi Gratis)'}
          </p>
          <p style={{ fontSize: 14 }}>
            <b>Tanggal:</b> {new Date(data.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      ) : (
        <div style={{ border: '2px solid #B91C1C', borderRadius: 12, padding: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#B91C1C' }}>Sertifikat Tidak Ditemukan</h1>
          <p style={{ fontSize: 13, color: '#6B7C93', marginTop: 8 }}>Nomor sertifikat tidak valid atau sudah tidak berlaku.</p>
        </div>
      )}
    </div>
  );
}