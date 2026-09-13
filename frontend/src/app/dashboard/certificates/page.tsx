'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from '../dashboard.module.css';
import Link from 'next/link';

interface Certificate {
  id: string;
  nomorSertifikat: string;
  issuedAt: string;
  eventRegistration: { event: { nama: string } };
}

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/certificates/me').then(setCerts).catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;

  return (
    <div>
      <h1 className={styles.pageTitle}>Sertifikat Saya</h1>
      <p className={styles.pageSubtitle}>Sertifikat yang kamu peroleh dari babak final.</p>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {certs.map((cert) => (
          <Link key={cert.id} href={`/dashboard/certificates/${cert.id}`} className={`${styles.card} ${styles.cardHover}`} style={{ display: 'block' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>🏅</div>
            <p style={{ fontWeight: 700, fontSize: 14 }}>{cert.eventRegistration.event.nama}</p>
            <p style={{ fontSize: 12, color: '#6B7C93', marginTop: 4 }}>No: {cert.nomorSertifikat}</p>
            <p style={{ fontSize: 11, color: '#9CA8B8', marginTop: 2 }}>
              Terbit: {new Date(cert.issuedAt).toLocaleDateString('id-ID')}
            </p>
          </Link>
        ))}
        {certs.length === 0 && (
          <p style={{ color: '#6B7C93' }}>Belum ada sertifikat. Selesaikan babak final suatu event untuk mendapatkannya.</p>
        )}
      </div>
    </div>
  );
}