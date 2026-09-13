'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from '../dashboard.module.css';

interface Program {
  id: string;
  nama: string;
  tipe: string;
  kriteria: string | null;
  deadlineAt: string | null;
}
interface MyApplication {
  id: string;
  status: string;
  program: { id: string; nama: string };
}

export default function ScholarshipsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    apiFetch('/scholarship-programs').then(setPrograms).catch((e) => setError(e.message));
    apiFetch('/scholarship-applications/me').then(setMyApplications).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function handleApply(programId: string) {
    setApplyingId(programId);
    setMessage(null);
    try {
      await apiFetch(`/scholarship-programs/${programId}/apply`, { method: 'POST', body: { dokumenPendukung: [] } });
      setMessage('Pengajuan terkirim!');
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal mengajukan');
    } finally {
      setApplyingId(null);
    }
  }

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;

  const statusBadge = (status: string) => {
    if (status === 'disetujui') return styles.badgeGreen;
    if (status === 'ditolak') return styles.badgeRed;
    return styles.badgeYellow;
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Program Beasiswa</h1>
      <p className={styles.pageSubtitle}>Ajukan beasiswa untuk akses konten atau bantuan dana.</p>
      {message && <p style={{ fontSize: 13, color: '#0E9C82', marginBottom: 12 }}>{message}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {programs.map((p) => {
          const applied = myApplications.find((a) => a.program.id === p.id);
          return (
            <div key={p.id} className={`${styles.card} ${styles.cardHover}`}>
              <p style={{ fontWeight: 700, fontSize: 14 }}>{p.nama}</p>
              <p style={{ fontSize: 12.5, color: '#6B7C93', marginTop: 4 }}>{p.kriteria}</p>
              <p style={{ fontSize: 11.5, color: '#9CA8B8', margin: '4px 0 12px' }}>
                {p.deadlineAt && `Tenggat: ${new Date(p.deadlineAt).toLocaleDateString('id-ID')}`}
              </p>
              {applied ? (
                <span className={`${styles.badge} ${statusBadge(applied.status)}`}>{applied.status}</span>
              ) : (
                <button
                  disabled={applyingId === p.id}
                  onClick={() => handleApply(p.id)}
                  className={styles.btnPrimary}
                >
                  {applyingId === p.id ? 'Mengajukan...' : 'Ajukan'}
                </button>
              )}
            </div>
          );
        })}
        {programs.length === 0 && <p style={{ color: '#6B7C93' }}>Tidak ada program tersedia.</p>}
      </div>
    </div>
  );
}