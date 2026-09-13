'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from '../../dashboard.module.css';

interface Option { id: string; urutan: string; tipe: string; konten: string; }
interface Question { id: string; questionType: string; questionText: string | null; questionImageUrl: string | null; options: Option[]; }
interface AttemptData { attemptId: string; durasiMenit: number; questions: Question[]; }

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function ChallengePage() {
  const params = useParams();
  const roundId = params.roundId as string;
  const router = useRouter();

  const [phase, setPhase] = useState<'checking' | 'countdown' | 'quiz'>('checking');
  const [waktuMulaiTarget, setWaktuMulaiTarget] = useState<number | null>(null);
  const [sisaCountdown, setSisaCountdown] = useState(0);

  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startedAt, setStartedAt] = useState<number>(0);
  const [sisaWaktuKerjakan, setSisaWaktuKerjakan] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const autoSubmitted = useRef(false);

  async function mulaiAttempt() {
    try {
      const data = await apiFetch(`/event-rounds/${roundId}/attempts/start`, { method: 'POST' });
      setAttempt(data);
      setStartedAt(Date.now());
      setSisaWaktuKerjakan(data.durasiMenit * 60 * 1000);
      setPhase('quiz');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memulai babak');
    }
  }

  useEffect(() => {
    apiFetch(`/event-rounds/${roundId}/my-session`)
      .then((res) => {
        if (res.hasSession && res.waktuMulai) {
          const target = new Date(res.waktuMulai).getTime();
          if (target > Date.now()) {
            setWaktuMulaiTarget(target);
            setPhase('countdown');
            return;
          }
        }
        mulaiAttempt();
      })
      .catch(() => mulaiAttempt());
  }, [roundId]);

  useEffect(() => {
    if (phase !== 'countdown' || !waktuMulaiTarget) return;
    const interval = setInterval(() => {
      const sisa = waktuMulaiTarget - Date.now();
      setSisaCountdown(sisa);
      if (sisa <= 0) {
        clearInterval(interval);
        mulaiAttempt();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, waktuMulaiTarget]);

  useEffect(() => {
    if (phase !== 'quiz' || !attempt) return;
    const batasWaktu = startedAt + attempt.durasiMenit * 60 * 1000;
    const interval = setInterval(() => {
      const sisa = batasWaktu - Date.now();
      setSisaWaktuKerjakan(sisa);
      if (sisa <= 0 && !autoSubmitted.current) {
        autoSubmitted.current = true;
        clearInterval(interval);
        handleFinish();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, attempt, startedAt]);

  function selectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  async function handleFinish() {
    if (!attempt) return;
    setSubmitting(true);
    setError(null);
    try {
      for (const question of attempt.questions) {
        const optionId = answers[question.id];
        if (!optionId) continue;
        const waktuJawabDetik = Math.round((Date.now() - startedAt) / 1000);
        await apiFetch(`/event-attempts/${attempt.attemptId}/submit-answer`, {
          method: 'POST',
          body: { questionId: question.id, optionId, waktuJawabDetik },
        });
      }
      await apiFetch(`/event-attempts/${attempt.attemptId}/finish`, { method: 'POST' });
      router.push(`/dashboard/results/${attempt.attemptId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyelesaikan attempt');
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <p style={{ color: '#B91C1C' }}>{error}</p>;

  if (phase === 'checking') {
    return <p style={{ color: '#6B7C93' }}>Memeriksa jadwal kamu...</p>;
  }

  if (phase === 'countdown') {
    return (
      <div style={{ maxWidth: 420, margin: '60px auto', textAlign: 'center' }} className={styles.cardDark}>
        <p style={{ fontSize: 13, color: '#B7C6DC', marginBottom: 12 }}>Babak ini akan dimulai dalam:</p>
        <p style={{ fontSize: 48, fontWeight: 800, letterSpacing: 2 }}>{formatCountdown(sisaCountdown)}</p>
        <p style={{ fontSize: 12, color: '#B7C6DC', marginTop: 12 }}>
          Halaman ini akan otomatis pindah ke soal begitu waktunya tiba. Jangan tutup halaman ini.
        </p>
      </div>
    );
  }

  if (!attempt) return <p style={{ color: '#6B7C93' }}>Memuat soal...</p>;  if (!attempt || !attempt.questions) return <p style={{ color: '#6B7C93' }}>Memuat soal...</p>;
  const totalDijawab = Object.keys(answers).length;
  const waktuHampirHabis = sisaWaktuKerjakan < 60000;

  return (
    <div style={{ maxWidth: 640, position: 'relative' }}>
      <div style={{
        position: 'fixed', top: 76, right: 16, zIndex: 50,
        background: waktuHampirHabis ? '#B91C1C' : '#12325C', color: '#fff',
        padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontSize: 15,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}>
        {formatCountdown(sisaWaktuKerjakan)}
      </div>

      <div className={styles.cardDark} style={{ marginBottom: 20 }}>
        <h1 style={{ fontWeight: 700, fontSize: 16 }}>Mengerjakan Babak</h1>
        <p style={{ fontSize: 12.5, marginTop: 4 }}>{totalDijawab}/{attempt.questions.length} terjawab</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {attempt.questions.map((question, idx) => (
          <div key={question.id} className={styles.card}>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{idx + 1}. {question.questionText}</p>
            {question.questionImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={question.questionImageUrl} alt="Ilustrasi soal" style={{ maxWidth: '100%', borderRadius: 10, marginBottom: 10 }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {question.options.map((opt) => {
                const selected = answers[question.id] === opt.id;
                return (
                  <label key={opt.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '10px 12px',
                    borderRadius: 8, background: selected ? '#CCFBF1' : '#F8FAFC', cursor: 'pointer',
                    border: selected ? '1.5px solid #22D3AE' : '1.5px solid transparent',
                  }}>
                    <input type="radio" name={question.id} checked={selected} onChange={() => selectOption(question.id, opt.id)} />
                    <b>{opt.urutan}.</b> {opt.konten}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleFinish} disabled={submitting} className={styles.btnTeal} style={{ width: '100%', marginTop: 20 }}>
        {submitting ? 'Mengirim...' : 'Selesaikan & Kumpulkan'}
      </button>
    </div>
  );
}