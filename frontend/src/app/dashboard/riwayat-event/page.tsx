'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from '../dashboard.module.css';

interface RiwayatItem {
  eventNama: string;
  babakNama: string;
  tanggal: string;
  skor: number | null;
  status: string;
  gelar: string | null;
}

const GELAR_LABEL: Record<string, string> = {
  juara_1: 'Juara 1', juara_2: 'Juara 2', juara_3: 'Juara 3',
  harapan_1: 'Harapan 1', harapan_2: 'Harapan 2', harapan_3: 'Harapan 3',
};

export default function RiwayatEventPage() {
  const [items, setItems] = useState<RiwayatItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/events/mine/history').then(setItems).catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;

  return (
    <div>
      <h1 className={styles.pageTitle}>Riwayat Event</h1>
      <p className={styles.pageSubtitle}>Semua babak yang sudah kamu selesaikan.</p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #EEF2F6' }}>
              <th style={{ padding: '8px 6px' }}>Event</th>
              <th style={{ padding: '8px 6px' }}>Babak</th>
              <th style={{ padding: '8px 6px' }}>Tanggal</th>
              <th style={{ padding: '8px 6px' }}>Skor</th>
              <th style={{ padding: '8px 6px' }}>Status</th>
              <th style={{ padding: '8px 6px' }}>Gelar</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #EEF2F6' }}>
                <td style={{ padding: '8px 6px', fontWeight: 600 }}>{item.eventNama}</td>
                <td style={{ padding: '8px 6px' }}>{item.babakNama}</td>
                <td style={{ padding: '8px 6px', color: '#6B7C93' }}>
                  {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}
                </td>
                <td style={{ padding: '8px 6px' }}>{item.skor ?? '-'}</td>
                <td style={{ padding: '8px 6px' }}>
                  <span style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 6,
                    background: item.status.startsWith('Lolos') ? '#CCFBF1' : item.status.startsWith('Tidak') ? '#FEE2E2' : '#F3F4F6',
                    color: item.status.startsWith('Lolos') ? '#0E9C82' : item.status.startsWith('Tidak') ? '#B91C1C' : '#6B7C93',
                  }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: '8px 6px', fontWeight: 700 }}>
                  {item.gelar ? GELAR_LABEL[item.gelar] ?? item.gelar : '-'}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 12, color: '#6B7C93' }}>Belum ada riwayat event.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}