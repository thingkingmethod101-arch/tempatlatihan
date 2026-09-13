'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from '../dashboard.module.css';

interface Announcement { id: string; judul: string; isi: string; createdAt: string; }

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/announcements').then(setItems).catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;

  return (
    <div>
      <h1 className={styles.pageTitle}>Pengumuman</h1>
      <p className={styles.pageSubtitle}>Semua informasi terbaru dari TempatLatihan.com.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((a) => (
          <div key={a.id} className={styles.card}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>{a.judul}</p>
            <p style={{ fontSize: 12, color: '#9CA8B8', margin: '4px 0 8px' }}>
              {new Date(a.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p style={{ fontSize: 13, color: '#333', lineHeight: 1.6 }}>{a.isi}</p>
          </div>
        ))}
        {items.length === 0 && <p style={{ color: '#6B7C93' }}>Belum ada pengumuman.</p>}
      </div>
    </div>
  );
}