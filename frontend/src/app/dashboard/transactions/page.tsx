'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from '../dashboard.module.css';

interface Transaction {
  id: string;
  totalTransfer: number;
  kodeUnik: number | null;
  status: string;
  createdAt: string;
}

export default function MyTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/transactions/me').then(setTransactions).catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;

  return (
    <div>
      <h1 className={styles.pageTitle}>Riwayat Transaksi Saya</h1>
      <p className={styles.pageSubtitle}>Status pembayaranmu untuk modul yang dibeli.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {transactions.map((t) => (
          <div key={t.id} className={`${styles.card} ${styles.cardHover}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>Rp{t.totalTransfer.toLocaleString('id-ID')}</p>
              {t.kodeUnik && <p style={{ fontSize: 11.5, color: '#6B7C93' }}>Kode unik: {t.kodeUnik}</p>}
              <p style={{ fontSize: 11, color: '#9CA8B8' }}>{new Date(t.createdAt).toLocaleString('id-ID')}</p>
            </div>
            <span className={`${styles.badge} ${t.status === 'lunas' ? styles.badgeGreen : styles.badgeYellow}`}>{t.status}</span>
          </div>
        ))}
        {transactions.length === 0 && <p style={{ color: '#6B7C93' }}>Belum ada transaksi.</p>}
      </div>
    </div>
  );
}