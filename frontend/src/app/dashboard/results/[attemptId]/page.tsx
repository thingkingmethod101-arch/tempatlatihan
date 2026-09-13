'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import styles from '../../dashboard.module.css';

interface AttemptResult {
  status: string;
  skorFinal100: number | null;
  xpDiperoleh: number | null;
  durasiPengerjaanDetik: number | null;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function ResultPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/event-attempts/${attemptId}/result`).then(setResult).catch((e) => setError(e.message));
  }, [attemptId]);

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;
  if (!result) return <p style={{ color: '#6B7C93' }}>Memuat hasil...</p>;

  return (
    <div style={{ maxWidth: 380 }} className={styles.card}>
      <h1 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Hasil Kamu</h1>
      <p style={{ fontSize: 42, fontWeight: 800, color: '#12325C' }}>
        {result.skorFinal100 ?? '-'}<span style={{ fontSize: 16, color: '#6B7C93' }}>/100</span>
      </p>
      <p style={{ marginTop: 8, color: '#0E9C82', fontWeight: 700, fontSize: 15 }}>+{result.xpDiperoleh ?? 0} XP</p>
      <p style={{ fontSize: 12, color: '#6B7C93', marginTop: 4 }}>
        Waktu pengerjaan: {formatDuration(result.durasiPengerjaanDetik)}
      </p>
      <Link href="/dashboard" className={styles.btnPrimary} style={{ display: 'inline-block', marginTop: 16, textAlign: 'center' }}>
        Kembali ke Beranda
      </Link>
    </div>
  );
}