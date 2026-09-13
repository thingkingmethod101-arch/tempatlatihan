'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import styles from '../../../dashboard.module.css';

export default function PayRoundPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params.roundId as string;
  const { user } = useAuth();

  const [kodeUnik, setKodeUnik] = useState<number | null>(null);
  const [totalTransfer, setTotalTransfer] = useState<number | null>(null);
  const [paid, setPaid] = useState(false);
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/event-rounds/${roundId}/pay`, { method: 'POST' })
      .then((res) => {
        setKodeUnik(res.kodeUnik);
        setTotalTransfer(res.totalTransfer);
        setPaid(res.paid);
      })
      .catch((e) => setError(e.message));

    apiFetch('/payment-settings').then(async (settings) => {
      if (settings?.qrisFileAssetId) {
        const signed = await apiFetch(`/files/${settings.qrisFileAssetId}/signed-url`);
        setQrisUrl(signed.url ?? null);
      }
    }).catch(() => {});
  }, [roundId]);

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;
  if (totalTransfer === null) return <p>Memuat...</p>;

  const waMessage = encodeURIComponent(
    `Konfirmasi pembayaran atas nama ${user?.kontak ?? '-'} dengan nominal Rp${totalTransfer.toLocaleString('id-ID')} (kode unik ${kodeUnik})`
  );
  const waUrl = `https://api.whatsapp.com/send/?phone=%2B6282322196419&text=${waMessage}&type=phone_number&app_absent=0`;

  return (
    <div style={{ maxWidth: 420 }} className={styles.card}>
      <h1 className={styles.pageTitle}>Pembayaran Babak</h1>

      {paid ? (
        <p style={{ color: '#0E9C82', fontWeight: 700, marginBottom: 16 }}>✅ Sudah lunas — kamu bisa mulai babak ini.</p>
      ) : (
        <>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            Transfer tepat Rp{totalTransfer.toLocaleString('id-ID')}
          </p>
          <p style={{ fontSize: 12.5, color: '#6B7C93', marginBottom: 16 }}>Kode unik: {kodeUnik}</p>

          {qrisUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrisUrl} alt="QRIS Pembayaran" style={{ width: 220, margin: '0 auto 16px', display: 'block', border: '1px solid #DCE7F2', borderRadius: 10 }} />
          )}

          <a href={waUrl} target="_blank" rel="noopener noreferrer" className={styles.btnTeal}
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 10 }}>
            💬 Konfirmasi via WhatsApp
          </a>
          <p style={{ fontSize: 11, color: '#9CA8B8', marginBottom: 16 }}>
            Setelah transfer, klik tombol di atas — pesan konfirmasi sudah terisi otomatis. Admin akan verifikasi secara manual.
          </p>
        </>
      )}

      <button onClick={() => router.push('/dashboard/events')} className={styles.btnOutline} style={{ width: '100%' }}>
        Kembali ke Event
      </button>
    </div>
  );
}