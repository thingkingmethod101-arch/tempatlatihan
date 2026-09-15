'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Option { id: string; urutan: string; konten: string; isCorrect: boolean; }
interface QuestionItem {
  id: string;
  questionText: string | null;
  questionImageUrl: string | null;
  statusModerasi: string;
  options: Option[];
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    apiFetch('/questions')
      .then((data: QuestionItem[]) => setQuestions(data.filter((q) => q.statusModerasi === 'menunggu')))
      .catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  async function handleModerate(id: string, statusModerasi: 'disetujui' | 'ditolak') {
    setProcessingId(id);
    try {
      await apiFetch(`/questions/${id}/moderate`, { method: 'PATCH', body: { statusModerasi } });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm('Hapus soal ini permanen?')) return;
    try {
      await apiFetch(`/questions/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal hapus soal');
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Moderasi Soal</h1>
      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="border rounded p-4">
            {q.questionText && <p className="mb-2">{q.questionText}</p>}
            {q.questionImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={q.questionImageUrl} alt="Gambar soal" className="max-w-sm rounded border mb-2" />
            )}
            <div className="space-y-1 mb-3">
              {q.options.map((opt) => (
                <p key={opt.id} className={`text-sm ${opt.isCorrect ? 'font-bold text-green-700' : ''}`}>
                  {opt.urutan}. {opt.konten} {opt.isCorrect && '✓'}
                </p>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                disabled={processingId === q.id}
                onClick={() => handleModerate(q.id, 'disetujui')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                Setujui
              </button>
              <button
                disabled={processingId === q.id}
                onClick={() => handleModerate(q.id, 'ditolak')}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                Tolak
              </button>
              <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-600 underline text-sm ml-2">
                Hapus
              </button>
            </div>
          </div>
        ))}
        {questions.length === 0 && <p className="text-gray-500">Tidak ada soal menunggu moderasi.</p>}
      </div>
    </div>
  );
}
