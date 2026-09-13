'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface CertDetail {
  nomorSertifikat: string;
  namaSiswa: string;
  kelas: string | null;
  namaSekolah: string | null;
  namaEvent: string;
  tanggalEvent: string | null;
}

export default function CertificateDetailPage() {
  const params = useParams();
  const [cert, setCert] = useState<CertDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/certificates/${params.certId}/detail`).then(setCert).catch((e) => setError(e.message));
  }, [params.certId]);

  if (error) return <p style={{ color: '#B91C1C', padding: 24 }}>{error}</p>;
  if (!cert) return <p style={{ padding: 24 }}>Memuat...</p>;

  return (
    <div>
      <div className="no-print" style={{ marginBottom: 16 }}>
        <button
          onClick={() => window.print()}
          style={{ background: '#12325C', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontWeight: 700, cursor: 'pointer' }}
        >
          🖨️ Cetak / Simpan sebagai PDF
        </button>
      </div>

      <div style={{
        maxWidth: 700, margin: '0 auto', background: '#fff', border: '10px solid #12325C', borderRadius: 4,
        padding: '48px 56px', textAlign: 'center', fontFamily: 'Georgia, serif',
      }}>
        <p style={{ fontSize: 12, letterSpacing: 2, color: '#6B7C93', textTransform: 'uppercase' }}>Sertifikat Penghargaan</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#12325C', margin: '12px 0' }}>{cert.namaSiswa}</h1>
        <p style={{ fontSize: 13, color: '#333' }}>
          {cert.kelas ? `Kelas ${cert.kelas} · ` : ''}{cert.namaSekolah || 'Sekolah tidak tercatat'}
        </p>

        <p style={{ margin: '24px 0 8px', fontSize: 14 }}>Telah berhasil menyelesaikan babak final pada event:</p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0E9C82', marginBottom: 8 }}>{cert.namaEvent}</h2>
        <p style={{ fontSize: 12.5, color: '#6B7C93' }}>
          {cert.tanggalEvent
            ? new Date(cert.tanggalEvent).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            : '-'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 56 }}>
          <div style={{ textAlign: 'left', fontSize: 11, color: '#9CA8B8' }}>
            No. Sertifikat<br /><b style={{ color: '#333' }}>{cert.nomorSertifikat}</b>
          </div>
          <div style={{ textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                `${typeof window !== 'undefined' ? window.location.origin : ''}/verifikasi/${cert.nomorSertifikat}`
              )}`}
              alt="QR Verifikasi Sertifikat"
              style={{ width: 80, height: 80, margin: '0 auto 8px', display: 'block' }}
            />
            <p style={{ fontSize: 12, fontWeight: 700 }}>Yosia Durhamastanto, S.Ak, M.Ak.</p>
            <p style={{ fontSize: 10.5, color: '#6B7C93' }}>Direktur Akademi</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none; }
          nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}