'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from '../dashboard.module.css';

interface Option { id: string; teks: string; }
interface Question { id: string; teks: string; allowMultiple: boolean; options: Option[]; }
interface ResultUser { nama: string; jenisKelamin: string | null; tanggalLahir: string | null; }
interface LaporanBagian { judul: string; isi: string[]; }
interface Result {
  id: string;
  createdAt: string;
  skorTrait: Record<string, Record<string, number>>;
  rekomendasi: string[];
  laporanKomprehensif: LaporanBagian[] | null;
  tipeTes: 'gratis' | 'berbayar';
  user: ResultUser;
}
interface StatusInfo { sudahPakaiGratis: boolean; harga: number; punyaAksesBerbayarBelumDipakai: boolean; }

function hitungUmur(tanggalLahir: string | null): string {
  if (!tanggalLahir) return '-';
  const lahir = new Date(tanggalLahir);
  const now = new Date();
  let umur = now.getFullYear() - lahir.getFullYear();
  const belumUlangTahun = now.getMonth() < lahir.getMonth() ||
    (now.getMonth() === lahir.getMonth() && now.getDate() < lahir.getDate());
  if (belumUlangTahun) umur--;
  return `${umur} tahun`;
}

const NAMA_GRUP: Record<string, string> = {
  riasec: 'Minat Karier (RIASEC)',
  gaya: 'Gaya Belajar',
  konsentrasi: 'Konsentrasi',
  mapel: 'Minat Mata Pelajaran',
};

const RIASEC_URUTAN = ['R', 'I', 'A', 'S', 'E', 'C'];

function RadarChartRiasec({ skorRiasec }: { skorRiasec: Record<string, number> }) {
  const size = 300;
  const center = size / 2;
  const maxRadius = 100;
  const jumlahSudut = RIASEC_URUTAN.length;

  function titikSudut(index: number, radius: number) {
    const sudut = (Math.PI * 2 * index) / jumlahSudut - Math.PI / 2;
    return { x: center + radius * Math.cos(sudut), y: center + radius * Math.sin(sudut) };
  }

  const nilai = RIASEC_URUTAN.map((kode) => skorRiasec[`riasec_${kode}`] ?? 0);
  const titikData = nilai.map((v, i) => titikSudut(i, (v / 100) * maxRadius));
  const pathData = titikData.map((t) => `${t.x},${t.y}`).join(' ');

  const cincin = [20, 40, 60, 80, 100];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: 300, margin: '0 auto', display: 'block' }}>
      {cincin.map((r) => {
        const titikCincin = RIASEC_URUTAN.map((_, i) => titikSudut(i, (r / 100) * maxRadius));
        return (
          <polygon
            key={r}
            points={titikCincin.map((t) => `${t.x},${t.y}`).join(' ')}
            fill="none"
            stroke="#DCE7F2"
            strokeWidth={1}
          />
        );
      })}

      {RIASEC_URUTAN.map((_, i) => {
        const ujung = titikSudut(i, maxRadius);
        return <line key={i} x1={center} y1={center} x2={ujung.x} y2={ujung.y} stroke="#DCE7F2" strokeWidth={1} />;
      })}

      <polygon points={pathData} fill="rgba(14,156,130,0.25)" stroke="#0E9C82" strokeWidth={2} />

      {titikData.map((t, i) => (
        <circle key={i} cx={t.x} cy={t.y} r={3} fill="#0E9C82" />
      ))}

      {RIASEC_URUTAN.map((kode, i) => {
        const labelPos = titikSudut(i, maxRadius + 18);
        return (
          <text key={kode} x={labelPos.x} y={labelPos.y} fontSize={12} fontWeight={700} fill="#12325C" textAnchor="middle" dominantBaseline="middle">
            {kode} ({nilai[i]}%)
          </text>
        );
      })}
    </svg>
  );
}

const PENJELASAN_PSIKOMETRI = `RIASEC, atau yang lebih dikenal sebagai Holland Code, adalah model tipologi minat karier yang dikembangkan oleh psikolog John L. Holland untuk menjelaskan bagaimana kecocokan antara kepribadian seseorang dengan lingkungan kerja/studi memengaruhi kepuasan dan keberhasilannya. Model ini mengelompokkan minat dan kepribadian ke dalam enam tipe: Realistic (praktis, menyukai kegiatan fisik/teknis), Investigative (analitis, menyukai penelitian dan pemecahan masalah), Artistic (kreatif, menyukai ekspresi diri), Social (menyukai interaksi dan membantu orang lain), Enterprising (menyukai kepemimpinan dan persuasi), serta Conventional (menyukai keteraturan dan pekerjaan terstruktur). Tujuan utama pengukuran RIASEC adalah membantu individu mengenali kecenderungan minatnya secara sistematis, sebagai bahan pertimbangan awal sebelum menentukan pilihan pendidikan atau pekerjaan. Secara teknis, perhitungan dilakukan dengan menjumlahkan skor dari seluruh butir pernyataan yang tergolong dalam masing-masing dari keenam tipe tersebut, kemudian dua tipe dengan skor tertinggi diambil sebagai representasi minat utama individu.`;

const SITASI_PSIKOMETRI = [
  'Holland, J. L. (1959). A theory of vocational choice. Journal of Counseling Psychology, 6(1), 35-45.',
  'Holland, J. L. (1997). Making vocational choices: A theory of vocational personalities and work environments (3rd ed.). Psychological Assessment Resources.',
  'Nauta, M. M. (2010). The development, evolution, and status of Hollands theory of vocational personalities. Journal of Counseling Psychology, 57(1), 11-22.',
];

export default function PsychTestPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [buyingAccess, setBuyingAccess] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{ totalTransfer: number; kodeUnik: number } | null>(null);
  const [modeKerjakanUlang, setModeKerjakanUlang] = useState(false);

  function loadResult() {
    apiFetch('/psych-test/me/latest').then(setResult).catch(() => {});
  }
  function loadStatus() {
    apiFetch('/psych-test/status').then(setStatus).catch(() => {});
  }

  useEffect(() => {
    loadResult();
    loadStatus();
  }, []);

  useEffect(() => {
    if (result && !modeKerjakanUlang) return;
    apiFetch('/psych-test/questions').then(setQuestions).catch((e) => setError(e.message));
  }, [result, modeKerjakanUlang]);

  function toggleAnswer(questionId: string, optionId: string, allowMultiple: boolean) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (allowMultiple) {
        const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
        return { ...prev, [questionId]: next };
      }
      return { ...prev, [questionId]: [optionId] };
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const tipeTes = modeKerjakanUlang ? 'berbayar' : 'gratis';
      const res = await apiFetch('/psych-test/submit', { method: 'POST', body: { jawaban: answers, tipeTes } });
      setResult(res);
      setModeKerjakanUlang(false);
      loadStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal submit tes');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBuyAccess() {
    setBuyingAccess(true);
    try {
      const res = await apiFetch('/transactions/psych-test', { method: 'POST' });
      setPaymentInfo({ totalTransfer: res.totalTransfer, kodeUnik: res.kodeUnik });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses pembayaran');
    } finally {
      setBuyingAccess(false);
    }
  }

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await apiFetch('/psych-test/upgrade', { method: 'POST' });
      setResult(res);
      loadStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal upgrade laporan');
    } finally {
      setUpgrading(false);
    }
  }

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;

  const belumPernahTes = !result;
  const sedangKerjakanSoal = belumPernahTes || modeKerjakanUlang;
  const punyaKredit = status?.punyaAksesBerbayarBelumDipakai ?? false;
  const sudahBerbayar = result?.tipeTes === 'berbayar';
  const pesanWa = paymentInfo
    ? `Halo Admin TempatLatihan.com, saya sudah transfer Rp${paymentInfo.totalTransfer.toLocaleString('id-ID')} (kode unik: ${paymentInfo.kodeUnik}) untuk pembayaran Tes Psikometri. Mohon dikonfirmasi ya. Terima kasih.`
    : '';

  const semuaTraitLengkap: { grup: string; trait: string; skor: number }[] = [];
  if (result?.skorTrait) {
    for (const [grup, traits] of Object.entries(result.skorTrait)) {
      for (const [traitKey, skor] of Object.entries(traits)) {
        semuaTraitLengkap.push({ grup: NAMA_GRUP[grup] ?? grup, trait: traitKey.replace(`${grup}_`, ''), skor });
      }
    }
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Tes Psikometri</h1>
      <p className={styles.pageSubtitle}>Kenali karakteristik belajar dan minat kariermu.</p>

      {result && (
        <>
          <div className="print" style={{ marginBottom: 20 }}>
            <div style={{
              maxWidth: 640, margin: '0 auto', background: '#fff', border: '2px solid #12325C', borderRadius: 8,
              padding: '32px 40px', fontFamily: 'Georgia, serif',
            }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <span style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
                  padding: '4px 14px', borderRadius: 20,
                  background: sudahBerbayar ? '#0E9C82' : '#F1F5F9',
                  color: sudahBerbayar ? '#fff' : '#6B7C93',
                }}>
                  {sudahBerbayar ? 'VERSI KOMPREHENSIF' : 'FREE TIER'}
                </span>
              </div>
              <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: '#12325C', margin: '4px 0 20px' }}>
                TempatLatihan.com
              </h2>

              <table style={{ width: '100%', fontSize: 13, marginBottom: 20, borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ padding: '4px 0', width: 140, color: '#6B7C93' }}>Nama</td><td><b>{result.user?.nama ?? '-'}</b></td></tr>
                  <tr><td style={{ padding: '4px 0', color: '#6B7C93' }}>Jenis Kelamin</td><td>{result.user?.jenisKelamin === 'L' ? 'Laki-laki' : result.user?.jenisKelamin === 'P' ? 'Perempuan' : '-'}</td></tr>
                  <tr><td style={{ padding: '4px 0', color: '#6B7C93' }}>Umur Saat Tes</td><td>{hitungUmur(result.user?.tanggalLahir)}</td></tr>
                  <tr><td style={{ padding: '4px 0', color: '#6B7C93' }}>Tanggal Tes</td><td>{new Date(result.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
                </tbody>
              </table>

              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, borderBottom: '1px solid #EEF2F6', paddingBottom: 4 }}>
                Ringkasan Kekuatan & Area Berkembang
              </h3>
              <table style={{ width: '100%', fontSize: 12.5, marginBottom: 20, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Kategori</th>
                    <th style={{ padding: '6px 8px' }}>Kekuatan (Skor Tertinggi)</th>
                    <th style={{ padding: '6px 8px' }}>Area Berkembang (Skor Terendah)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.skorTrait ?? {}).map(([grup, traits]) => {
                    const entries = Object.entries(traits).sort((a, b) => b[1] - a[1]);
                    const teratas = entries[0];
                    const terendah = entries[entries.length - 1];
                    return (
                      <tr key={grup} style={{ borderBottom: '1px solid #EEF2F6' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{NAMA_GRUP[grup] ?? grup}</td>
                        <td style={{ padding: '6px 8px', color: '#0E9C82' }}>
                          {teratas ? `${teratas[0].replace(`${grup}_`, '')} (${teratas[1]}%)` : '-'}
                        </td>
                        <td style={{ padding: '6px 8px', color: '#B91C1C' }}>
                          {terendah && terendah !== teratas ? `${terendah[0].replace(`${grup}_`, '')} (${terendah[1]}%)` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!sudahBerbayar && (
                <div style={{
                  border: '2px dashed #D97706', borderRadius: 8, padding: 16, marginBottom: 20,
                  background: '#FFFBEB', textAlign: 'center',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
                    Mau tahu kamu cocoknya bidang keahlian apa?
                  </p>
                  <p style={{ fontSize: 12.5, color: '#78350F' }}>
                    Coba versi eksklusifnya cuma uang jajan <b>Rp{status?.harga.toLocaleString('id-ID') ?? '...'}</b> —
                    kamu sudah bisa akses spider chart lengkap, tabel perbandingan semua kategori,
                    dan analisis mendalam per tipe kepribadian.
                  </p>
                </div>
              )}

              {sudahBerbayar && result.skorTrait?.riasec && (
                <>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, borderBottom: '1px solid #EEF2F6', paddingBottom: 4 }}>
                    Peta Kekuatan RIASEC (Spider Chart)
                  </h3>
                  <div style={{ marginBottom: 20 }}>
                    <RadarChartRiasec skorRiasec={result.skorTrait.riasec} />
                  </div>

                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, borderBottom: '1px solid #EEF2F6', paddingBottom: 4 }}>
                    Tabel Perbandingan Lengkap Semua Kategori
                  </h3>
                  <table style={{ width: '100%', fontSize: 12, marginBottom: 20, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px' }}>Kategori</th>
                        <th style={{ padding: '6px 8px' }}>Trait</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Skor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semuaTraitLengkap
                        .sort((a, b) => a.grup.localeCompare(b.grup) || b.skor - a.skor)
                        .map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #EEF2F6' }}>
                            <td style={{ padding: '5px 8px', color: '#6B7C93' }}>{row.grup}</td>
                            <td style={{ padding: '5px 8px', fontWeight: 600 }}>{row.trait.replace(/_/g, ' ')}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#0E9C82' }}>{row.skor}%</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </>
              )}

              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, borderBottom: '1px solid #EEF2F6', paddingBottom: 4 }}>
                Catatan & Rekomendasi
              </h3>
              {result.rekomendasi?.map((r, i) => (
                <p key={i} style={{ fontSize: 12.5, marginBottom: 4, color: '#333' }}>• {r}</p>
              ))}

              {sudahBerbayar && Array.isArray(result.laporanKomprehensif) && result.laporanKomprehensif.length > 0 &&
                typeof result.laporanKomprehensif[0] === 'object' && 'isi' in result.laporanKomprehensif[0] && (
                <div style={{ marginTop: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, margin: '20px 0 12px', color: '#D97706', textAlign: 'center', letterSpacing: 0.5 }}>
                    — ANALISIS KOMPREHENSIF —
                  </h3>
                  {result.laporanKomprehensif.map((bagian, i) => (
                    <div key={i} style={{ marginBottom: 18, pageBreakInside: 'avoid' }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#12325C', marginBottom: 6, borderLeft: '3px solid #0E9C82', paddingLeft: 8 }}>
                        {i + 1}. {bagian.judul}
                      </h4>
                      {bagian.isi.map((paragraf, j) => (
                        <p key={j} style={{ fontSize: 12.5, marginBottom: 6, color: '#333', lineHeight: 1.7, textAlign: 'justify' }}>
                          {paragraf}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <p style={{ fontSize: 10, color: '#9CA8B8', marginTop: 20, textAlign: 'center' }}>
                Hasil ini bersifat indikatif, bukan diagnosis psikologis resmi. Untuk pemahaman lebih dalam, konsultasikan dengan guru BK atau psikolog profesional.
              </p>

              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 11.5, color: '#000', lineHeight: 1.6, textIndent: '2em', textAlign: 'justify', marginBottom: 10 }}>
                  {PENJELASAN_PSIKOMETRI}
                </p>
                <p style={{ fontSize: 10.5, fontWeight: 700, color: '#000', marginBottom: 6 }}>Referensi:</p>
                {SITASI_PSIKOMETRI.map((sitasi, i) => (
                  <p key={i} style={{ fontSize: 10.5, color: '#000', lineHeight: 1.5, paddingLeft: 24, textIndent: -24, marginBottom: 8 }}>
                    {sitasi}
                  </p>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button onClick={() => window.print()} className={styles.btnOutline}>
                Cetak Sertifikat (PDF)
              </button>
            </div>
          </div>

          <div className="print-only" style={{ display: 'none' }}>
            <div style={{
              maxWidth: 700, margin: '40px auto', border: '6px double #12325C', borderRadius: 8,
              padding: '48px 56px', textAlign: 'center', fontFamily: 'Georgia, serif',
            }}>
              <p style={{ fontSize: 12, letterSpacing: 3, color: '#6B7C93', textTransform: 'uppercase' }}>Sertifikat Penyelesaian</p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#12325C', margin: '12px 0 6px' }}>TempatLatihan.com</h1>
              <p style={{ fontSize: 13, color: '#6B7C93', marginBottom: 24 }}>Tes Psikometri RIASEC</p>
              <p style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>Dengan ini menyatakan bahwa</p>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#12325C', margin: '8px 0', borderBottom: '2px solid #12325C', display: 'inline-block', padding: '0 24px 6px' }}>
                {result.user?.nama ?? '-'}
              </h2>
              <p style={{ fontSize: 13, color: '#333', margin: '16px 0 32px' }}>
                telah berhasil menyelesaikan Tes Psikometri RIASEC{sudahBerbayar ? ' (Versi Komprehensif)' : ''}{' '}
                pada tanggal {new Date(result.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
              </p>

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: '#6B7C93', marginBottom: 8 }}>Direktur TempatLatihan.com</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/verifikasi-psikotes/${result.id}`)}`}
                    alt="QR Verifikasi Tanda Tangan"
                    style={{ width: 90, height: 90, margin: '0 auto 8px' }}
                  />
                  <p style={{ fontSize: 14, fontWeight: 700, borderTop: '1px solid #333', paddingTop: 4, minWidth: 220 }}>
                    Yosia Durhamastanto, S.Ak., M.Ak.
                  </p>
                </div>
              </div>

              <p style={{ fontSize: 9, color: '#9CA8B8', marginTop: 32 }}>No. Sertifikat: PSI-{result.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </>
      )}

      {result && !sudahBerbayar && !modeKerjakanUlang && (
        <div className="print" style={{ border: '2px solid #D97706', borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Mau Analisis yang Lebih Lengkap?</h2>
          <p style={{ fontSize: 13, color: '#6B7C93', marginBottom: 16 }}>
            Dapatkan laporan komprehensif (spider chart + tabel perbandingan + analisis mendalam) seharga{' '}
            <b>Rp{status?.harga.toLocaleString('id-ID')}</b>.
          </p>

          {!punyaKredit && !paymentInfo && (
            <button onClick={handleBuyAccess} disabled={buyingAccess} className={styles.btnTeal}>
              {buyingAccess ? 'Memproses...' : `Bayar Rp${status?.harga.toLocaleString('id-ID')}`}
            </button>
          )}

          {paymentInfo && !punyaKredit && (
            <div>
              <p style={{ fontSize: 13, marginBottom: 12 }}>
                Transfer TEPAT <b>Rp{paymentInfo.totalTransfer.toLocaleString('id-ID')}</b> (kode unik: {paymentInfo.kodeUnik}),
                lalu tunggu konfirmasi admin. Refresh halaman ini setelah dikonfirmasi.
              </p>
              <a
                href={`https://wa.me/6282322196419?text=${encodeURIComponent(pesanWa)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
                style={{ background: '#25D366', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
              >
                Konfirmasi via WhatsApp
              </a>
            </div>
          )}

          {punyaKredit && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleUpgrade} disabled={upgrading} className={styles.btnTeal}>
                {upgrading ? 'Memproses...' : 'Upgrade Laporan Ini Saja'}
              </button>
              <button onClick={() => setModeKerjakanUlang(true)} className={styles.btnOutline}>
                Kerjakan Ulang (Laporan Baru)
              </button>
            </div>
          )}
        </div>
      )}

      {sedangKerjakanSoal && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {questions.map((q, idx) => (
              <div key={q.id} className={styles.card}>
                <p style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 10 }}>
                  {idx + 1}. {q.teks} {q.allowMultiple && <span style={{ fontSize: 11, color: '#9CA8B8' }}>(boleh lebih dari satu)</span>}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {q.options.map((opt) => {
                    const checked = (answers[q.id] ?? []).includes(opt.id);
                    return (
                      <label key={opt.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '8px 12px',
                        borderRadius: 8, background: checked ? '#EAF4FC' : '#F8FAFC', cursor: 'pointer',
                      }}>
                        <input
                          type={q.allowMultiple ? 'checkbox' : 'radio'}
                          name={q.id}
                          checked={checked}
                          onChange={() => toggleAnswer(q.id, opt.id, q.allowMultiple)}
                        />
                        {opt.teks}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {questions.length > 0 && (
            <button onClick={handleSubmit} disabled={submitting} className={styles.btnTeal} style={{ width: '100%', marginTop: 20 }}>
              {submitting ? 'Memproses...' : 'Kumpulkan Jawaban'}
            </button>
          )}
          {questions.length === 0 && <p style={{ color: '#6B7C93' }}>Belum ada pertanyaan tes.</p>}
        </>
      )}

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
