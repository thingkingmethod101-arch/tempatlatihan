'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import styles from './dashboard.module.css';
import { useAuth } from '@/lib/auth-context';

interface Announcement { id: string; judul: string; isi: string; createdAt: string; }
interface EventItem { id: string; nama: string; tipe: string; jenjang: string; }
interface Scholarship { id: string; nama: string; deskripsi: string | null; }
interface MyEvent { eventId: string; namaEvent: string; status: string; rounds: { id: string; namaBabak: string; jadwalMulai: string | null; urutan: number }[]; }
interface RecommendedModule { id: string; judul: string | null; }

export default function DashboardHomePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);
  const [recommended, setRecommended] = useState<RecommendedModule[]>([]);
  const [myReferralCodes, setMyReferralCodes] = useState<any[]>([]);
  const [kodeReferralInput, setKodeReferralInput] = useState('');
  const [savedReferralInfo, setSavedReferralInfo] = useState<{ kode: string; persenDiskon: number } | null>(null);
  const [checkingKode, setCheckingKode] = useState(false);
  const [kodeMessage, setKodeMessage] = useState<string | null>(null);
  const [kodeCashbackInput, setKodeCashbackInput] = useState('');
  const [claimingCashback, setClaimingCashback] = useState(false);
  const [cashbackMessage, setCashbackMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const [tutorProfile, setTutorProfile] = useState<{ statusVerifikasi: string } | null>(null);
  const [modulMenungguCount, setModulMenungguCount] = useState(0);
  const [outstanding, setOutstanding] = useState<{ modulMenunggu: number; permohonanHapus: number; soalMenunggu: number; transaksiMenunggu: number } | null>(null);
 
  useEffect(() => {
    apiFetch('/referral/me').then(setMyReferralCodes).catch(() => {});
  }, []);

  useEffect(() => {
    apiFetch('/announcements').then((data) => setAnnouncements(data.slice(0, 3))).catch(() => {});
    apiFetch('/events').then((data) => setEvents(data.slice(0, 4))).catch(() => {});
    apiFetch('/scholarships').then((data) => setScholarships(data.slice(0, 3))).catch(() => {});
    apiFetch('/events/mine/registered').then(setMyEvents).catch(() => {});
    apiFetch('/contents/recommended').then(setRecommended).catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('savedReferralCode');
    const savedPersen = localStorage.getItem('savedReferralPersen');
    if (saved && savedPersen) {
      setSavedReferralInfo({ kode: saved, persenDiskon: Number(savedPersen) });
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'tutor') {
      apiFetch('/tutor-profiles/me').then(setTutorProfile).catch(() => {});
      apiFetch('/contents/mine').then((list: any[]) => {
        setModulMenungguCount(list.filter((c) => c.statusModerasi === 'menunggu').length);
      }).catch(() => {});
    }
    if (user?.role === 'admin') {
      Promise.all([
        apiFetch('/contents/admin/pending-count'),
        apiFetch('/questions/admin/pending-count'),
        apiFetch('/transactions/admin/pending-count'),
      ]).then(([c, q, t]) => {
        setOutstanding({
          modulMenunggu: c.modulMenunggu,
          permohonanHapus: c.permohonanHapus,
          soalMenunggu: q.soalMenunggu,
          transaksiMenunggu: t.transaksiMenunggu,
        });
      }).catch(() => {});
    }
  }, [user]);

  async function handleSimpanKode() {
    if (!kodeReferralInput) return;
    setCheckingKode(true);
    setKodeMessage(null);
    try {
      const res = await apiFetch(`/referral/check/${kodeReferralInput.toUpperCase()}`);
      localStorage.setItem('savedReferralCode', kodeReferralInput.toUpperCase());
      localStorage.setItem('savedReferralPersen', String(res.persenDiskon ?? 0));
      setSavedReferralInfo({ kode: kodeReferralInput.toUpperCase(), persenDiskon: res.persenDiskon ?? 0 });
      setKodeReferralInput('');
      setKodeMessage(`Kode berhasil disimpan! Diskon ${res.persenDiskon}% akan otomatis dipakai saat kamu beli modul.`);
    } catch (e) {
      setKodeMessage(e instanceof Error ? e.message : 'Kode tidak valid');
    } finally {
      setCheckingKode(false);
    }
  }

  function handleHapusKode() {
    localStorage.removeItem('savedReferralCode');
    localStorage.removeItem('savedReferralPersen');
    setSavedReferralInfo(null);
  }

  async function handleKlaimCashback() {
    if (!kodeCashbackInput) return;
    setClaimingCashback(true);
    setCashbackMessage(null);
    try {
      const res = await apiFetch('/referral/redeem-cashback', { method: 'POST', body: { kode: kodeCashbackInput.toUpperCase() } });
      setCashbackMessage(res.message);
      setKodeCashbackInput('');
    } catch (e) {
      setCashbackMessage(e instanceof Error ? e.message : 'Gagal klaim kode');
    } finally {
      setClaimingCashback(false);
    }
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Beranda</h1>
      <p className={styles.pageSubtitle}>Ringkasan informasi terbaru untuk kamu.</p>


      {user?.role === 'tutor' && tutorProfile && tutorProfile.statusVerifikasi !== 'disetujui' && (
        <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>
            Akun tutor kamu sedang menunggu verifikasi admin. Kamu belum bisa membuat/menjual modul sampai disetujui.
          </p>
        </div>
      )}
      {user?.role === 'tutor' && modulMenungguCount > 0 && (
        <div style={{ background: '#EAF4FC', border: '1px solid #BFDCF5', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#12325C' }}>
            Kamu punya {modulMenungguCount} modul yang masih menunggu moderasi admin.
          </p>
        </div>
      )}

      {user?.role === 'admin' && outstanding && (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 16 }}>
          {outstanding.soalMenunggu > 0 && (
            <Link href="/dashboard/admin/questions" style={{ display: 'block', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 8, padding: 12, textDecoration: 'none' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#B91C1C' }}>{outstanding.soalMenunggu}</p>
              <p style={{ fontSize: 12, color: '#7F1D1D' }}>Soal menunggu moderasi</p>
            </Link>
          )}
          {outstanding.modulMenunggu > 0 && (
            <Link href="/dashboard/admin/content" style={{ display: 'block', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 8, padding: 12, textDecoration: 'none' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#B91C1C' }}>{outstanding.modulMenunggu}</p>
              <p style={{ fontSize: 12, color: '#7F1D1D' }}>Modul menunggu moderasi</p>
            </Link>
          )}
          {outstanding.permohonanHapus > 0 && (
            <Link href="/dashboard/admin/delete-requests" style={{ display: 'block', background: '#FFF7ED', border: '1px solid #F59E0B', borderRadius: 8, padding: 12, textDecoration: 'none' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#92400E' }}>{outstanding.permohonanHapus}</p>
              <p style={{ fontSize: 12, color: '#78350F' }}>Permohonan hapus konten</p>
            </Link>
          )}
          {outstanding.transaksiMenunggu > 0 && (
            <Link href="/dashboard/admin/transactions" style={{ display: 'block', background: '#EAF4FC', border: '1px solid #BFDCF5', borderRadius: 8, padding: 12, textDecoration: 'none' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#12325C' }}>{outstanding.transaksiMenunggu}</p>
              <p style={{ fontSize: 12, color: '#1E3A5F' }}>Transaksi menunggu konfirmasi</p>
            </Link>
          )}
        </div>
      )}

      <div className={styles.card} style={{ marginBottom: 16 }}>
        <h2 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Punya Kode Referral?</h2>
        {savedReferralInfo ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13 }}>
              Kode <b style={{ fontFamily: 'monospace' }}>{savedReferralInfo.kode}</b> tersimpan —
              diskon {savedReferralInfo.persenDiskon}% siap dipakai saat beli modul.
            </p>
            <button onClick={handleHapusKode} className={styles.btnOutline} style={{ fontSize: 12 }}>Hapus</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className={styles.input}
              placeholder="Masukkan kode referral (contoh: AB12CD)"
              value={kodeReferralInput}
              onChange={(e) => setKodeReferralInput(e.target.value.toUpperCase())}
            />
            <button onClick={handleSimpanKode} disabled={checkingKode} className={styles.btnTeal} style={{ whiteSpace: 'nowrap' }}>
              {checkingKode ? 'Cek...' : 'Simpan Kode'}
            </button>
          </div>
        )}
        {kodeMessage && <p style={{ fontSize: 12, marginTop: 8, color: '#6B7C93' }}>{kodeMessage}</p>}
      </div>

      <div className={styles.card} style={{ marginBottom: 16 }}>
        <h2 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Punya Kode Cashback?</h2>
        <p style={{ fontSize: 12, color: '#6B7C93', marginBottom: 8 }}>
          Beda dari kode diskon — kode cashback perlu diklaim manual di sini supaya admin bisa proses transfernya.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className={styles.input}
            placeholder="Masukkan kode cashback"
            value={kodeCashbackInput}
            onChange={(e) => setKodeCashbackInput(e.target.value.toUpperCase())}
          />
          <button onClick={handleKlaimCashback} disabled={claimingCashback} className={styles.btnTeal} style={{ whiteSpace: 'nowrap' }}>
            {claimingCashback ? 'Memproses...' : 'Klaim Cashback'}
          </button>
        </div>
        {cashbackMessage && <p style={{ fontSize: 12, marginTop: 8, color: '#6B7C93' }}>{cashbackMessage}</p>}
      </div>


      {myEvents.length > 0 && (
        <div className={styles.cardDark} style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Kompetisi yang Kamu Ikuti</h2>
          {myEvents.map((ev) => (
            <Link key={ev.eventId} href="/dashboard/events" style={{
              display: 'block', padding: '10px 12px', marginBottom: 8, borderRadius: 8,
              background: 'rgba(255,255,255,0.08)', textDecoration: 'none', color: '#fff',
            }}>
              <p style={{ fontWeight: 600, fontSize: 13.5 }}>{ev.namaEvent}</p>
              <p style={{ fontSize: 11.5, color: '#B7C6DC', marginTop: 2 }}>
                {ev.rounds.length} babak · Status: {ev.status === 'terdaftar' ? 'Terdaftar' : 'Menunggu pembayaran'}
              </p>
            </Link>
          ))}
        </div>
      )}

      {recommended.length > 0 && (
        <div className={styles.card} style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Rekomendasi Modul Untukmu</h2>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {recommended.map((m) => (
              <Link key={m.id} href={`/dashboard/modules/${m.id}`} style={{
                display: 'block', padding: '10px 12px', borderRadius: 8, background: '#F8FAFC',
                fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#12325C',
              }}>
                {m.judul || 'Modul'}
              </Link>
            ))}
          </div>
        </div>
      )}

      {myReferralCodes.length > 0 && (
        <div className={styles.cardDark} style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Kode Referral Kamu</h2>
          {myReferralCodes.map((r: any) => (
            <div key={r.id} style={{ marginBottom: 10, padding: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>{r.kode}</p>
                {typeof r.sisaHari === 'number' && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: r.sisaHari <= 3 ? '#FEE2E2' : 'rgba(255,255,255,0.15)',
                    color: r.sisaHari <= 3 ? '#B91C1C' : '#fff',
                  }}>
                    {r.sudahKadaluarsa ? 'Kadaluarsa' : `${r.sisaHari} hari lagi`}
                  </span>
                )}
              </div>
              {r.tipe === 'diskon' ? (
                <p style={{ fontSize: 11.5, color: '#B7C6DC', marginTop: 4 }}>
                  Bagikan kode ini ke teman — mereka dapat diskon {r.persenDiskon}% saat beli modul/event.
                  Sudah dipakai {r.jumlahDipakaiOrangLain}/{r.maxUsage} orang.
                </p>
              ) : (
                <p style={{ fontSize: 11.5, color: '#B7C6DC', marginTop: 4 }}>
                  Kode cashback — admin akan menghubungimu via WhatsApp untuk proses pencairan.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className={styles.card}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ fontWeight: 700, fontSize: 15 }}>Pengumuman</h2>
            <Link href="/dashboard/announcements" style={{ fontSize: 12, color: '#0E9C82' }}>Lihat Semua →</Link>
          </div>
          {announcements.map((a) => (
            <div key={a.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #EEF2F6' }}>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{a.judul}</p>
              <p style={{ fontSize: 12, color: '#6B7C93', marginTop: 2 }}>
                {a.isi.length > 90 ? a.isi.slice(0, 90) + '...' : a.isi}
              </p>
            </div>
          ))}
          {announcements.length === 0 && <p style={{ fontSize: 12.5, color: '#9CA8B8' }}>Belum ada pengumuman.</p>}
        </div>

        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ fontWeight: 700, fontSize: 15 }}>Event Tersedia</h2>
            <Link href="/dashboard/events" style={{ fontSize: 12, color: '#0E9C82' }}>Lihat Semua →</Link>
          </div>
          {events.map((e) => (
            <div key={e.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #EEF2F6' }}>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{e.nama}</p>
              <p style={{ fontSize: 12, color: '#6B7C93', marginTop: 2 }}>{e.tipe} · Jenjang {e.jenjang}</p>
            </div>
          ))}
          {events.length === 0 && <p style={{ fontSize: 12.5, color: '#9CA8B8' }}>Belum ada event tersedia.</p>}
        </div>

        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ fontWeight: 700, fontSize: 15 }}>Beasiswa</h2>
            <Link href="/dashboard/scholarships" style={{ fontSize: 12, color: '#0E9C82' }}>Lihat Semua →</Link>
          </div>
          {scholarships.map((s) => (
            <div key={s.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #EEF2F6' }}>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{s.nama}</p>
              {s.deskripsi && (
                <p style={{ fontSize: 12, color: '#6B7C93', marginTop: 2 }}>
                  {s.deskripsi.length > 90 ? s.deskripsi.slice(0, 90) + '...' : s.deskripsi}
                </p>
              )}
            </div>
          ))}
          {scholarships.length === 0 && <p style={{ fontSize: 12.5, color: '#9CA8B8' }}>Belum ada beasiswa tersedia.</p>}
        </div>
      </div>

      <Link href="/dashboard/psych-test" style={{ display: 'block', marginBottom: 24 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/isi%20tes%20psikometri%20gratis.png"
          alt="Ikuti Tes Psikometri Gratis"
          style={{ width: '50%', display: 'block', margin: '0 auto', borderRadius: 12, cursor: 'pointer' }}
        />
      </Link>
    </div>

  );
}