'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import styles from '../dashboard.module.css';

interface ContentItem {
  id: string;
  judul: string | null;
  deskripsi: string | null;
  thumbnailUrl: string | null;
  chapters: { judul: string }[];
  pricing: { durasiBulan: number; harga: string }[];
}

export default function ModulesPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);

  function load() {
    apiFetch('/contents').then(setContents).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (user?.role === 'siswa' || user?.role === 'tutor') {
      apiFetch('/contents/purchased/me').then((list: any[]) => setPurchasedIds(list.map((c) => c.id))).catch(() => {});
    }
  }, [user]);

  async function handleDelete(id: string) {
    if (!confirm('Hapus modul ini permanen? Semua data terkait (bab, komentar, rating) ikut terhapus.')) return;
    try {
      await apiFetch(`/contents/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal hapus modul');
    }
  }

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;

  return (
    <div>
      <h1 className={styles.pageTitle}>Modul Belajar</h1>
      <p className={styles.pageSubtitle}>Materi dan latihan soal dari tutor terverifikasi.</p>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {contents.map((c) => (
          <div key={c.id} className={`${styles.card} ${styles.cardHover}`}>
            <Link href={`/dashboard/modules/${c.id}`} style={{ display: 'block' }}>
              {c.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.thumbnailUrl} alt={c.judul || 'Sampul modul'} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />
              )}
              <p style={{ fontWeight: 700, fontSize: 14 }}>{c.judul || 'Modul Tanpa Judul'}</p>
              <p style={{ fontSize: 12.5, color: '#6B7C93', margin: '6px 0 12px', lineHeight: 1.5 }}>
                {c.deskripsi || 'Tidak ada deskripsi.'}
              </p>
              {purchasedIds.includes(c.id) && (
                <span style={{
                  display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 700,
                  background: '#CCFBF1', color: '#0E9C82', padding: '3px 10px', borderRadius: 20,
                }}>
                  Sudah Dibeli
                </span>
              )}
              {c.pricing[0] && Number(c.pricing[0].harga) <= 0 ? (
                <span style={{ fontWeight: 800, fontSize: 15, color: '#0E9C82' }}>GRATIS</span>
              ) : (
                <p style={{ fontWeight: 800, fontSize: 15, color: '#12325C' }}>
                  {c.pricing[0] ? `Rp${c.pricing[0].harga} / ${c.pricing[0].durasiBulan} bulan` : '-'}
                </p>
              )}
            </Link>
            {isAdmin && (
              <button
                onClick={() => handleDelete(c.id)}
                style={{
                  marginTop: 10, fontSize: 11.5, color: '#B91C1C', textDecoration: 'underline',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                Hapus
              </button>
            )}
          </div>
        ))}
        {contents.length === 0 && <p style={{ color: '#6B7C93' }}>Belum ada modul tersedia.</p>}
      </div>
    </div>
  );
}