'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import styles from '../dashboard.module.css';

interface Round { id: string; namaBabak: string; isFree: boolean; isFinal: boolean; durasiMenit: number; biaya: string | null; }
interface EventItem {
  id: string;
  nama: string;
  tipe: string;
  jenjang: string;
  biaya: string | null;
  rounds: Round[];
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<Record<string, { paid: boolean }>>({});
  const [accessStatus, setAccessStatus] = useState<Record<string, { allowed: boolean; reason: string | null }>>({});
  const [grupWaInfo, setGrupWaInfo] = useState<{ eventId: string; link: string } | null>(null);
  const [registerModalEventId, setRegisterModalEventId] = useState<string | null>(null);
  const [registerForm, setRegisterForm] = useState({ alamatPengiriman: '', asalSekolahSaatDaftar: '', kelasSaatDaftar: '' });
  const [myRegistrations, setMyRegistrations] = useState<Record<string, boolean>>({});
  const [kelasSaya, setKelasSaya] = useState<string | null>(null);
 

  useEffect(() => {
    apiFetch('/events').then(setEvents).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    apiFetch('/users/me').then((u) => setKelasSaya(u.kelas ?? null)).catch(() => {});
  }, []);

  useEffect(() => {
    events.forEach((event) => {
      event.rounds.forEach((round) => {
        if (round.biaya && Number(round.biaya) > 0) {
          apiFetch(`/event-rounds/${round.id}/payment-status`)
            .then((res) => setPaymentStatus((prev) => ({ ...prev, [round.id]: { paid: res.paid } })))
            .catch(() => {});
        }
      });
    });
  }, [events]);

  useEffect(() => {
    events.forEach((event) => {
      event.rounds.forEach((round) => {
        apiFetch(`/event-rounds/${round.id}/access-status`)
          .then((res) => setAccessStatus((prev) => ({ ...prev, [round.id]: res })))
          .catch(() => {});
      });
    });
  }, [events]);

  useEffect(() => {
    events.forEach((event) => {
      apiFetch(`/events/${event.id}/my-registration`)
        .then((res) => setMyRegistrations((prev) => ({ ...prev, [event.id]: !!res })))
        .catch(() => {});
    });
  }, [events]);

  async function handleRegister(eventId: string) {
    setRegisteringId(eventId);
    setMessage(null);
    setGrupWaInfo(null);
    try {
      const res = await apiFetch(`/events/${eventId}/register`, {
        method: 'POST',
        body: registerForm,
      });
      if (res.kodeUnik) {
        setMessage(
          `Terdaftar! Event ini berbayar — transfer TEPAT Rp${res.totalTransfer.toLocaleString('id-ID')} ` +
          `(kode unik: ${res.kodeUnik}), lalu tunggu admin konfirmasi sebelum bisa mulai mengerjakan.`
        );
      } else {
        setMessage('Berhasil daftar! Kamu bisa langsung mulai mengerjakan.');
        if (res.grupWaLink) setGrupWaInfo({ eventId, link: res.grupWaLink });
      }
      setMyRegistrations((prev) => ({ ...prev, [eventId]: true }));
      setRegisterModalEventId(null);
      setRegisterForm({ alamatPengiriman: '', asalSekolahSaatDaftar: '', kelasSaatDaftar: '' });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal daftar');
    } finally {
      setRegisteringId(null);
    }
  }

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;

  return (
    <div>
      <h1 className={styles.pageTitle}>Daftar Event</h1>
      <p className={styles.pageSubtitle}>Ikuti olimpiade dan kompetisi yang tersedia.</p>

      {message && (
        <div className={styles.card} style={{ background: '#EAF4FC', borderColor: '#BFDCF5', marginBottom: 16, padding: 12 }}>
          <p style={{ fontSize: 13 }}>{message}</p>
        </div>
      )}

      {grupWaInfo && (
        <div className={styles.card} style={{ marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>Gabung Grup WhatsApp Event</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(grupWaInfo.link)}`}
            alt="QR Grup WhatsApp"
            style={{ margin: '0 auto 8px' }}
          />
          <a href={grupWaInfo.link} target="_blank" rel="noopener noreferrer" className={styles.btnTeal} style={{ textDecoration: 'none' }}>
            Buka Link Grup
          </a>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[...events]
          .sort((a, b) => {
            const skorA = (myRegistrations[a.id] ? 2 : 0) + (kelasSaya && a.jenjang === kelasSaya ? 1 : 0);
            const skorB = (myRegistrations[b.id] ? 2 : 0) + (kelasSaya && b.jenjang === kelasSaya ? 1 : 0);
            return skorB - skorA;
          })
          .map((event) => (
          <div key={event.id} className={`${styles.card} ${styles.cardHover}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 15 }}>{event.nama}</h2>
                <p style={{ fontSize: 12.5, color: '#6B7C93', marginTop: 2 }}>
                  {event.tipe} · Jenjang {event.jenjang} ·{' '}
                  {event.biaya && Number(event.biaya) > 0 ? `Rp${event.biaya}` : 'Gratis'}
                </p>
              </div>
              {myRegistrations[event.id] ? (
                <span className={`${styles.badge} ${styles.badgeGreen}`}>Sudah Terdaftar</span>
              ) : (
                <button
                  onClick={() => setRegisterModalEventId(event.id)}
                  className={styles.btnTeal}
                >
                  Daftar
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {event.rounds.map((round) => {
                const berbayar = round.biaya && Number(round.biaya) > 0;
                const sudahLunas = paymentStatus[round.id]?.paid;
                const akses = accessStatus[round.id];
                const bolehMulai = (!berbayar || sudahLunas) && (akses?.allowed ?? true);

                return (
                  <div key={round.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#F8FAFC', padding: '8px 12px', borderRadius: 8, fontSize: 12.5,
                  }}>
                    <span>
                      {round.namaBabak}{' '}
                      {round.isFinal && <span className={`${styles.badge} ${styles.badgeYellow}`} style={{ marginLeft: 6 }}>Final</span>}
                      {' '}· {round.durasiMenit} menit
                      {berbayar && <span style={{ marginLeft: 6, color: '#6B7C93' }}>· Rp{Number(round.biaya).toLocaleString('id-ID')}</span>}
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {berbayar && !sudahLunas && (
                        <Link href={`/dashboard/events/pay/${round.id}`} className={styles.btnTeal} style={{ fontSize: 11.5, padding: '5px 12px' }}>
                          Bayar
                        </Link>
                      )}
                      <Link
                        href={bolehMulai ? `/dashboard/challenge/${round.id}` : '#'}
                        onClick={(e) => { if (!bolehMulai) e.preventDefault(); }}
                        className={styles.btnOutline}
                        style={{
                          fontSize: 11.5, padding: '5px 12px',
                          opacity: bolehMulai ? 1 : 0.4,
                          cursor: bolehMulai ? 'pointer' : 'not-allowed',
                        }}
                      >
                        Mulai
                      </Link>
                      {!bolehMulai && !berbayar && akses?.reason && (
                        <span style={{ fontSize: 10, color: '#9CA8B8' }}>{akses.reason}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {events.length === 0 && <p style={{ color: '#6B7C93' }}>Belum ada event tersedia.</p>}
      </div>

      {registerModalEventId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(11,31,58,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className={styles.card} style={{ maxWidth: 380, width: '90%' }}>
            <h2 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Lengkapi Data Pendaftaran</h2>
            <p style={{ fontSize: 11.5, color: '#6B7C93', marginBottom: 12 }}>
              Data ini dipakai khusus untuk event ini (pengiriman piala & data sekolah terkini).
            </p>
            <textarea
              className={styles.textarea}
              placeholder="Alamat lengkap sekolah untuk pengiriman piala/sertifikat"
              value={registerForm.alamatPengiriman}
              onChange={(e) => setRegisterForm({ ...registerForm, alamatPengiriman: e.target.value })}
              style={{ marginBottom: 10 }}
            />
            <input
              className={styles.input}
              placeholder="Nama sekolah saat ini"
              value={registerForm.asalSekolahSaatDaftar}
              onChange={(e) => setRegisterForm({ ...registerForm, asalSekolahSaatDaftar: e.target.value })}
              style={{ marginBottom: 14 }}
            />
            <input
              className={styles.input}
              placeholder="Kelas saat ini (contoh: 5 SD, 8 SMP)"
              value={registerForm.kelasSaatDaftar}
              onChange={(e) => setRegisterForm({ ...registerForm, kelasSaatDaftar: e.target.value })}
              style={{ marginBottom: 14 }}
            />            
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setRegisterModalEventId(null)} className={styles.btnOutline} style={{ flex: 1 }}>
                Batal
              </button>
              <button
                onClick={() => handleRegister(registerModalEventId)}
                disabled={registeringId === registerModalEventId || !registerForm.alamatPengiriman || !registerForm.asalSekolahSaatDaftar}
                className={styles.btnTeal}
                style={{ flex: 1 }}
              >
                {registeringId === registerModalEventId ? 'Memproses...' : 'Daftar Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
