'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface Option { id: string; urutan: string; konten: string; }
interface Question { id: string; questionText: string | null; questionImageUrl: string | null; options: Option[]; }
interface ChapterData {
  tipe: 'viewer_pdf' | 'latihan_soal';
  pdfUrl?: string | null;
  questions?: Question[];
}

export default function ReadChapterPage() {
  const params = useParams();
  const chapterId = params.chapterId as string;

  const [data, setData] = useState<ChapterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    apiFetch(`/contents/chapters/${chapterId}`).then(setData).catch((e) => setError(e.message));
  }, [chapterId]);

  async function handleAnswer(questionId: string, optionId: string) {
    setChecking(true);
    setFeedback(null);
    try {
      const res = await apiFetch(`/contents/chapters/${chapterId}/questions/${questionId}/check`, {
        method: 'POST',
        body: { optionId },
      });
      setFeedback(res.benar ? '✅ Benar!' : '❌ Kurang tepat, coba pahami lagi ya.');
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Gagal cek jawaban');
    } finally {
      setChecking(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Memuat...</p>;

  if (data.tipe === 'viewer_pdf') {
    return (
      <div>
        <h1 className="text-xl font-bold mb-4">Materi</h1>
        {data.pdfUrl ? (
          <iframe
            src={`${data.pdfUrl}#toolbar=0`}
            className="w-full border rounded"
            style={{ height: '80vh' }}
            title="Materi PDF"
          />
        ) : (
          <p className="text-gray-500">Materi belum tersedia.</p>
        )}
      </div>
    );
  }

  const questions = data.questions ?? [];
  const current = questions[qIndex];

  if (!current) return <p>Tidak ada soal di bab ini.</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-1">Latihan Soal</h1>
      <p className="text-sm text-gray-500 mb-4">Soal {qIndex + 1} dari {questions.length}</p>

      <div className="border rounded p-4">
        {current.questionText && <p className="mb-3">{current.questionText}</p>}
        {current.questionImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.questionImageUrl} alt="Soal" className="mb-3 max-w-full rounded" />
        )}
        <div className="space-y-2">
          {current.options.map((opt) => (
            <button
              key={opt.id}
              disabled={checking}
              onClick={() => handleAnswer(current.id, opt.id)}
              className="w-full text-left border rounded p-3 hover:bg-gray-50 disabled:opacity-50"
            >
              <b>{opt.urutan}.</b> {opt.konten}
            </button>
          ))}
        </div>
        {feedback && <p className="mt-3 font-medium">{feedback}</p>}
      </div>

      <div className="flex justify-between mt-4">
        <button disabled={qIndex === 0} onClick={() => { setQIndex(qIndex - 1); setFeedback(null); }}
          className="text-sm text-gray-600 disabled:opacity-30">
          ← Soal sebelumnya
        </button>
        <button disabled={qIndex >= questions.length - 1} onClick={() => { setQIndex(qIndex + 1); setFeedback(null); }}
          className="text-sm text-blue-600 disabled:opacity-30">
          Soal selanjutnya →
        </button>
      </div>
    </div>
  );
}