'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from '../dashboard.module.css';
import Link from 'next/link';

interface TalentItem {
  skillNode: string;
  akurasi: string;
  totalSoal: number;
  ranking: number | null;
  rekomendasi: { saranJurusan: string[]; saranKarier: string[] } | null;
}
interface SkillNode { id: string; nama: string; }
interface SurveyItem {
  id: string;
  suka: boolean;
  alasanTidakSuka: string | null;
  preferensiGaya: string | null;
  skillNode: { nama: string };
}

const ALASAN_OPTIONS = [
  { v: 'kurang_seru', l: 'Kurang seru' },
  { v: 'sulit_dipahami', l: 'Sulit dipahami' },
  { v: 'pengalaman_buruk', l: 'Pernah ada pengalaman kurang enak' },
  { v: 'lainnya', l: 'Lainnya' },
];
const GAYA_OPTIONS = [
  { v: 'cerita', l: 'Lewat cerita/analogi' },
  { v: 'visual', l: 'Lewat gambar/visual' },
  { v: 'sesi_singkat', l: 'Sesi belajar singkat-singkat' },
  { v: 'banyak_latihan', l: 'Banyak latihan soal' },
];

export default function TalentPage() {
  const [talent, setTalent] = useState<TalentItem[]>([]);
  const [skillNodes, setSkillNodes] = useState<SkillNode[]>([]);
  const [surveys, setSurveys] = useState<SurveyItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ skillNodeId: '', suka: true, alasanTidakSuka: '', preferensiGaya: '' });

  function load() {
    apiFetch('/talent/me').then(setTalent).catch((e) => setError(e.message));
    apiFetch('/learning-style-surveys/me').then(setSurveys).catch(() => {});
  }

  useEffect(() => {
    load();
    apiFetch('/skill-nodes', { auth: false }).then(setSkillNodes).catch(() => {});
  }, []);

  async function handleSubmitSurvey(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await apiFetch('/learning-style-surveys', {
        method: 'POST',
        body: {
          skillNodeId: form.skillNodeId,
          suka: form.suka,
          alasanTidakSuka: !form.suka && form.alasanTidakSuka ? form.alasanTidakSuka : undefined,
          preferensiGaya: form.preferensiGaya || undefined,
        },
      });
      setMessage('Survei tersimpan, terima kasih!');
      setForm({ skillNodeId: '', suka: true, alasanTidakSuka: '', preferensiGaya: '' });
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal menyimpan survei');
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;

  return (
    <div>
      <h1 className={styles.pageTitle}>Pemetaan Talenta</h1>
      <p className={styles.pageSubtitle}>Lihat kekuatanmu dan bantu sistem memahami gaya belajarmu.</p>

      {/* ==== Penjelasan Teknis 3 Sumber Data ==== */}
      <div className={styles.card} style={{ marginBottom: 20, padding: 18 }}>
        <h2 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: '#12325C' }}>
          Kenapa Ada 3 Jenis Pengukuran di Halaman Ini?
        </h2>
        <p style={{ fontSize: 12.5, color: '#6B7C93', marginBottom: 14 }}>
          Ketiganya mengukur hal yang berbeda, saling melengkapi — bukan saling menggantikan.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', fontWeight: 700, color: '#12325C' }}></th>
                <th style={{ padding: '8px 10px', fontWeight: 700, color: '#12325C' }}>Pemetaan Talenta</th>
                <th style={{ padding: '8px 10px', fontWeight: 700, color: '#12325C' }}>Tes Psikometri (RIASEC)</th>
                <th style={{ padding: '8px 10px', fontWeight: 700, color: '#12325C' }}>Survei Gaya Belajar (per topik)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: '1px solid #EEF2F6' }}>
                <td style={{ padding: '8px 10px', fontWeight: 600, color: '#6B7C93' }}>Sumbernya</td>
                <td style={{ padding: '8px 10px' }}>
                  <b style={{ color: '#0E9C82' }}>Objektif</b> — dihitung dari hasil jawaban soal sungguhan saat kamu ikut event/olimpiade
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <b style={{ color: '#D97706' }}>Subjektif</b> — kamu isi sendiri lewat survei &quot;suka/tidak suka kegiatan ini&quot;
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <b style={{ color: '#D97706' }}>Subjektif</b> — kamu isi sendiri per topik pelajaran (suka/tidak + alasan + gaya favorit)
                </td>
              </tr>
              <tr style={{ borderTop: '1px solid #EEF2F6' }}>
                <td style={{ padding: '8px 10px', fontWeight: 600, color: '#6B7C93' }}>Butuh Apa Dulu</td>
                <td style={{ padding: '8px 10px' }}>Minimal 1x ikut event dan kerjakan soal</td>
                <td style={{ padding: '8px 10px' }}>Kapan saja, tidak perlu ikut event dulu</td>
                <td style={{ padding: '8px 10px' }}>Kapan saja, tidak perlu ikut event dulu</td>
              </tr>
              <tr style={{ borderTop: '1px solid #EEF2F6' }}>
                <td style={{ padding: '8px 10px', fontWeight: 600, color: '#6B7C93' }}>Mengukur Apa</td>
                <td style={{ padding: '8px 10px' }}>
                  Kemampuan aktual per topik (misal: &quot;kamu 85% benar di Aljabar, tapi cuma 40% di Geometri&quot;)
                </td>
                <td style={{ padding: '8px 10px' }}>
                  Minat/preferensi umum dan gaya belajar (misal: &quot;kamu cenderung tipe Social-Artistic&quot;)
                </td>
                <td style={{ padding: '8px 10px' }}>
                  Perasaan kamu terhadap 1 topik tertentu, dan cara mengajar yang paling cocok buatmu
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: 11, color: '#9CA8B8', marginTop: 12, lineHeight: 1.6 }}>
          Kalau kamu baru bergabung dan belum pernah ikut event, wajar kalau bagian &quot;Pemetaan Talenta&quot; di bawah
          masih kosong — sistem memang belum punya bukti kemampuanmu dari soal yang pernah dikerjakan.
          Sambil menunggu itu, kamu tetap bisa langsung coba Tes Psikometri atau isi Survei Gaya Belajar,
          karena keduanya tidak butuh syarat apapun.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: 24 }}>
        {talent.map((item) => (
          <div key={item.skillNode} className={`${styles.card} ${styles.cardHover}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 700, fontSize: 14 }}>{item.skillNode}</h2>
              {item.ranking && <span className={`${styles.badge} ${styles.badgeTeal}`}>#{item.ranking}</span>}
            </div>
            <p style={{ fontSize: 12.5, color: '#6B7C93', margin: '4px 0' }}>Akurasi: {item.akurasi}% dari {item.totalSoal} soal</p>
            {item.rekomendasi && (
              <div style={{ fontSize: 11.5, marginTop: 8, borderTop: '1px solid #EEF2F6', paddingTop: 8 }}>
                <p><b>Jurusan:</b> {item.rekomendasi.saranJurusan.join(', ')}</p>
                <p style={{ marginTop: 2 }}><b>Karier:</b> {item.rekomendasi.saranKarier.join(', ')}</p>
              </div>
            )}
          </div>
        ))}
        {talent.length === 0 && (
          <p style={{ color: '#6B7C93', gridColumn: '1/-1' }}>Belum ada data. Kerjakan minimal 1 event dulu.</p>
        )}
      </div>

      <div className={styles.cardDark} style={{ marginBottom: 20, textAlign: 'center' }}>
        <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>🧭 Mau Tahu Gaya Belajarmu?</h2>
        <p style={{ fontSize: 13, color: '#B7C6DC', marginBottom: 16 }}>
          Ikuti Tes Psikometri kami — hasilnya langsung kasih tahu tipe minat kariermu (RIASEC),
          gaya belajar yang cocok, dan seberapa fokus konsentrasimu.
        </p>
        <Link href="/dashboard/psych-test" className={styles.btnTeal} style={{ textDecoration: 'none', padding: '10px 24px' }}>
          Mulai Tes Psikometri
        </Link>
      </div>

      {/* ==== BARU: Form Isi Survei Gaya Belajar (sebelumnya sudah ada kodenya, tapi tidak pernah dirender) ==== */}
      <div className={styles.card} style={{ marginBottom: 24, padding: 18 }}>
        <h2 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: '#12325C' }}>Isi Survei Gaya Belajar per Topik</h2>
        <p style={{ fontSize: 12, color: '#6B7C93', marginBottom: 14 }}>
          Pilih 1 topik pelajaran, kasih tahu kami apakah kamu suka topik itu dan cara belajar seperti apa yang paling cocok buatmu.
        </p>

        <form onSubmit={handleSubmitSurvey} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#12325C', marginBottom: 4 }}>
              Topik Pelajaran
            </label>
            <select
              value={form.skillNodeId}
              onChange={(e) => setForm({ ...form, skillNodeId: e.target.value })}
              required
              style={{ width: '100%', border: '1px solid #DCE7F2', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}
            >
              <option value="">Pilih topik...</option>
              {skillNodes.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#12325C', marginBottom: 4 }}>
              Apakah kamu suka topik ini?
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setForm({ ...form, suka: true })}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  border: form.suka ? '2px solid #0E9C82' : '1px solid #DCE7F2',
                  background: form.suka ? '#CCFBF1' : '#fff', fontWeight: form.suka ? 700 : 400,
                }}
              >
                👍 Suka
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, suka: false })}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  border: !form.suka ? '2px solid #B91C1C' : '1px solid #DCE7F2',
                  background: !form.suka ? '#FEE2E2' : '#fff', fontWeight: !form.suka ? 700 : 400,
                }}
              >
                👎 Kurang Suka
              </button>
            </div>
          </div>

          {!form.suka && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#12325C', marginBottom: 4 }}>
                Kenapa kurang suka? (opsional)
              </label>
              <select
                value={form.alasanTidakSuka}
                onChange={(e) => setForm({ ...form, alasanTidakSuka: e.target.value })}
                style={{ width: '100%', border: '1px solid #DCE7F2', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}
              >
                <option value="">Pilih alasan (opsional)...</option>
                {ALASAN_OPTIONS.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#12325C', marginBottom: 4 }}>
              Cara belajar favoritmu untuk topik ini (opsional)
            </label>
            <select
              value={form.preferensiGaya}
              onChange={(e) => setForm({ ...form, preferensiGaya: e.target.value })}
              style={{ width: '100%', border: '1px solid #DCE7F2', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}
            >
              <option value="">Pilih gaya favorit (opsional)...</option>
              {GAYA_OPTIONS.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}
            </select>
          </div>

          {message && <p style={{ fontSize: 12.5, color: message.includes('tersimpan') ? '#0E9C82' : '#B91C1C' }}>{message}</p>}

          <button
            type="submit"
            disabled={submitting || !form.skillNodeId}
            className={styles.btnTeal}
            style={{ marginTop: 4, opacity: submitting || !form.skillNodeId ? 0.5 : 1 }}
          >
            {submitting ? 'Menyimpan...' : 'Kirim Survei'}
          </button>
        </form>
      </div>

      <div>
        <h2 style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Riwayat Survei</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {surveys.map((s) => (
            <div key={s.id} className={styles.card} style={{ padding: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{s.skillNode.nama} — {s.suka ? '👍 Suka' : '👎 Kurang suka'}</p>
              {s.alasanTidakSuka && <p style={{ fontSize: 11.5, color: '#6B7C93' }}>Alasan: {s.alasanTidakSuka.replace(/_/g, ' ')}</p>}
              {s.preferensiGaya && <p style={{ fontSize: 11.5, color: '#6B7C93' }}>Gaya favorit: {s.preferensiGaya.replace(/_/g, ' ')}</p>}
            </div>
          ))}
          {surveys.length === 0 && <p style={{ color: '#6B7C93', fontSize: 13 }}>Belum pernah isi survei.</p>}
        </div>
      </div>
    </div>
  );
}
