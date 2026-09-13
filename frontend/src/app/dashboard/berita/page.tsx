'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from '../dashboard.module.css';

interface BeritaItem { id: string; judul: string; tag: string | null; isi: string; gambarUrl: string | null; createdAt: string; }

export default function BeritaPage() {
  const [items, setItems] = useState<BeritaItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/berita').then(setItems).catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;

  return (
    <div>
      <h1 className={styles.pageTitle}>Berita & Kolaborasi</h1>
      <p className={styles.pageSubtitle}>Kabar terbaru seputar TempatLatihan.com.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((b) => (
          <div key={b.id} className={styles.card}>
            {b.gambarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.gambarUrl} alt={b.judul} style={{ width: '100%', borderRadius: 8, marginBottom: 10 }} />
            )}
            {b.tag && <span className={`${styles.badge} ${styles.badgeTeal}`} style={{ marginBottom: 6, display: 'inline-block' }}>{b.tag}</span>}
            <p style={{ fontWeight: 700, fontSize: 15 }}>{b.judul}</p>
            <p style={{ fontSize: 12, color: '#9CA8B8', margin: '4px 0 8px' }}>
              {new Date(b.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p style={{ fontSize: 13, color: '#333', lineHeight: 1.6 }}>{b.isi}</p>
          </div>
        ))}
        {items.length === 0 && <p style={{ color: '#6B7C93' }}>Belum ada berita.</p>}
      </div>
    </div>
  );
}