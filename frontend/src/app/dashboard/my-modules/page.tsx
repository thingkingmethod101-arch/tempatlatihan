'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import styles from '../dashboard.module.css';

interface ContentItem {
  id: string;
  judul: string | null;
  deskripsi: string | null;
  chapters: { id: string; judul: string; tipe: string }[];
}

export default function MyModulesPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/contents/purchased/me').then(setContents).catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;

  return (
    <div>
      <h1 className={styles.pageTitle}>Modul Saya</h1>
      <p className={styles.pageSubtitle}>Modul yang sudah kamu beli.</p>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {contents.map((c) => {
          const punyaPdf = c.chapters.some((ch) => ch.tipe === 'viewer_pdf');
          const punyaSoal = c.chapters.some((ch) => ch.tipe === 'latihan_soal');
          return (
            <Link key={c.id} href={`/dashboard/my-modules/${c.id}`} className={`${styles.card} ${styles.cardHover}`} style={{ display: 'block' }}>
              <p style={{ fontWeight: 700, fontSize: 14 }}>{c.judul || 'Modul Tanpa Judul'}</p>
              <p style={{ fontSize: 12, color: '#6B7C93', margin: '6px 0 10px', lineHeight: 1.5 }}>
                {c.deskripsi || 'Tidak ada deskripsi.'}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {punyaPdf && (
                  <span className={`${styles.badge} ${styles.badgeTeal}`}>Materi PDF</span>
                )}
                {punyaSoal && (
                  <span className={`${styles.badge} ${styles.badgeYellow}`}>Latihan Soal</span>
                )}
              </div>
            </Link>
          );
        })}
        {contents.length === 0 && <p style={{ color: '#6B7C93' }}>Belum ada modul yang dibeli.</p>}
      </div>
    </div>
  );
}