'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface VerifyResult {
  valid: boolean;
  nomorSertifikat?: string;
  namaSiswa?: string;
  namaEvent?: string;
  tanggalTerbit?: string;
}

export default function VerifikasiPage() {
  const params = useParams();
  const [data, setData] = useState<VerifyResult | null>(null);

  useEffect(() => {
    apiFetch(`/certificates/verify/${params.nomor}`, { auth: false }).then(setData).catch(() => setData({ valid: false }));
  }, [params.nomor]);

  if (!data) return <p style={{ padding: 40, textAlign: 'center' }}>Memeriksa...</p>;

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: 24, fontFamily: 'sans-serif', textAlign: 'center' }}>
      {data.valid ? (
        <>
          <div style={{ fontSize: 40, marginBottom: 8 }}>OK</div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0E9C82', marginBottom: 16 }}>Sertifikat Terverifikasi Asli</h1>
          <div style={{ textAlign: 'left', border: '1px solid #EEF2F6', borderRadius: 10, padding: 16, fontSize: 13.5 }}>
            <p><b>Nomor:</b> {data.nomorSertifikat}</p>
            <p><b>Nama:</b> {data.namaSiswa}</p>
            <p><b>Event:</b> {data.namaEvent}</p>
            <p><b>Terbit:</b> {data.tanggalTerbit ? new Date(data.tanggalTerbit).toLocaleDateString('id-ID') : '-'}</p>
          </div>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#B91C1C' }}>Sertifikat Tidak Ditemukan</h1>
          <p style={{ fontSize: 13, color: '#6B7C93', marginTop: 8 }}>Nomor sertifikat ini tidak terdaftar di sistem kami.</p>
        </>
      )}
    </div>
  );
}