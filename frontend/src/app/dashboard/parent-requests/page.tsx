'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from '../dashboard.module.css';

interface LinkItem {
  id: string;
  status: string;
  parent?: { id: string; nama: string; kontak: string };
}

export default function ParentRequestsPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  function load() {
    apiFetch('/parent-links/me').then(setLinks).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  async function handleDecision(id: string, decision: 'approve' | 'reject') {
    setProcessingId(id);
    try {
      await apiFetch(`/parent-links/${id}/${decision}`, { method: 'PATCH' });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses');
    } finally {
      setProcessingId(null);
    }
  }

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;

  return (
    <div>
      <h1 className={styles.pageTitle}>Permintaan dari Orang Tua</h1>
      <p className={styles.pageSubtitle}>Setujui agar orang tuamu bisa memantau progres belajarmu.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {links.map((link) => (
          <div key={link.id} className={styles.card} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14 }}>{link.parent?.nama}</p>
              <p style={{ fontSize: 12, color: '#6B7C93' }}>{link.parent?.kontak}</p>
              <span className={`${styles.badge} ${link.status === 'pending' ? styles.badgeYellow : styles.badgeGray}`} style={{ marginTop: 4, display: 'inline-block' }}>
                {link.status}
              </span>
            </div>
            {link.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={processingId === link.id} onClick={() => handleDecision(link.id, 'approve')} className={styles.btnTeal}>
                  Setujui
                </button>
                <button disabled={processingId === link.id} onClick={() => handleDecision(link.id, 'reject')} className={styles.btnOutline}>
                  Tolak
                </button>
              </div>
            )}
          </div>
        ))}
        {links.length === 0 && <p style={{ color: '#6B7C93' }}>Tidak ada permintaan.</p>}
      </div>
    </div>
  );
}