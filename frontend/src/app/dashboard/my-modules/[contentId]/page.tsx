'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface Chapter { id: string; judul: string; tipe: string; }
interface ContentDetail { judul: string | null; deskripsi: string | null; chapters: Chapter[]; }
interface Option { id: string; urutan: string; tipe: string; konten: string; }
interface Question { id: string; questionText: string | null; questionImageUrl: string | null; sudahBenar: boolean; options: Option[]; }
interface ChapterData { tipe: 'viewer_pdf' | 'latihan_soal' | 'video_youtube'; pdfUrl?: string | null; videoUrl?: string | null; questions?: Question[]; }
interface Comment { id: string; isi: string; user: { nama: string }; replies: { id: string; isi: string; user: { nama: string } }[]; }

function getYoutubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function ModuleReaderPage() {
  const params = useParams();
  const contentId = params.contentId as string;

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [videoChapters, setVideoChapters] = useState<Chapter[]>([]);
  const [pdfChapters, setPdfChapters] = useState<Chapter[]>([]);
  const [soalChapters, setSoalChapters] = useState<Chapter[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activePdfId, setActivePdfId] = useState<string | null>(null);
  const [activeSoalId, setActiveSoalId] = useState<string | null>(null);

  const [videoData, setVideoData] = useState<ChapterData | null>(null);
  const [pdfData, setPdfData] = useState<ChapterData | null>(null);
  const [soalData, setSoalData] = useState<ChapterData | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    apiFetch(`/contents/${contentId}`).then((c) => {
      setContent(c);
      const videos = c.chapters.filter((ch: Chapter) => ch.tipe === 'video_youtube');
      const pdfs = c.chapters.filter((ch: Chapter) => ch.tipe === 'viewer_pdf');
      const soals = c.chapters.filter((ch: Chapter) => ch.tipe === 'latihan_soal');
      setVideoChapters(videos);
      setPdfChapters(pdfs);
      setSoalChapters(soals);
      if (videos[0]) setActiveVideoId(videos[0].id);
      if (pdfs[0]) setActivePdfId(pdfs[0].id);
      if (soals[0]) setActiveSoalId(soals[0].id);
    }).catch((e) => setError(e.message));

    apiFetch(`/contents/${contentId}/comments`).then(setComments).catch(() => {});
  }, [contentId]);

  useEffect(() => {
    if (!activeVideoId) return;
    apiFetch(`/contents/chapters/${activeVideoId}`).then(setVideoData).catch((e) => setError(e.message));
  }, [activeVideoId]);

  useEffect(() => {
    if (!activePdfId) return;
    setPdfData(null);
    apiFetch(`/contents/chapters/${activePdfId}`).then(setPdfData).catch((e) => setError(e.message));
  }, [activePdfId]);

  useEffect(() => {
    if (!activeSoalId) return;
    setSoalData(null);
    setQIndex(0);
    setFeedback(null);
    apiFetch(`/contents/chapters/${activeSoalId}`).then(setSoalData).catch((e) => setError(e.message));
  }, [activeSoalId]);

  async function handleAnswer(questionId: string, optionId: string) {
    if (!activeSoalId) return;
    try {
      const res = await apiFetch(`/contents/chapters/${activeSoalId}/questions/${questionId}/check`, {
        method: 'POST',
        body: { optionId },
      });
      setFeedback(res.benar ? 'Benar!' : 'Kurang tepat, coba pahami lagi ya.');
      if (res.benar) {
        setSoalData((prev) => prev ? {
          ...prev,
          questions: prev.questions?.map((q) => q.id === questionId ? { ...q, sudahBenar: true } : q),
        } : prev);
      }
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Gagal cek jawaban');
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await apiFetch(`/contents/${contentId}/comments`, { method: 'POST', body: { isi: newComment } });
      setNewComment('');
      apiFetch(`/contents/${contentId}/comments`).then(setComments).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal kirim komentar');
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!content) return <p>Memuat...</p>;

  const questions = soalData?.questions ?? [];
  const currentQuestion = questions[qIndex];
  const embedUrl = videoData?.videoUrl ? getYoutubeEmbedUrl(videoData.videoUrl) : null;

  return (
    <div className="max-w-6xl">
      <h1 className="text-xl font-bold mb-4">{content.judul || 'Modul'}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="space-y-4">
          {videoChapters.length > 0 && (
            <div>
              <h2 className="font-semibold mb-2 text-sm text-gray-500">Video</h2>
              {videoChapters.length > 1 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {videoChapters.map((ch) => (
                    <button key={ch.id} onClick={() => setActiveVideoId(ch.id)}
                      className={`text-xs px-3 py-1 rounded ${activeVideoId === ch.id ? 'bg-black text-white' : 'bg-gray-100'}`}>
                      {ch.judul}
                    </button>
                  ))}
                </div>
              )}
              {embedUrl ? (
                <div className="aspect-video w-full">
                  <iframe src={embedUrl} className="w-full h-full rounded border" allowFullScreen title="Video Pembelajaran" />
                </div>
              ) : <p className="text-gray-400 text-sm">Video belum tersedia.</p>}
            </div>
          )}

          <div className="border rounded p-4">
            <h2 className="font-semibold mb-2 text-sm text-gray-500">Deskripsi</h2>
            <p className="text-sm text-gray-700">{content.deskripsi || 'Tidak ada deskripsi.'}</p>
          </div>

          <div className="border rounded p-4">
            <h2 className="font-semibold mb-3 text-sm text-gray-500">Komentar</h2>
            <form onSubmit={handleSubmitComment} className="flex gap-2 mb-4">
              <input className="flex-1 border p-2 rounded text-sm" placeholder="Tulis komentar..."
                value={newComment} onChange={(e) => setNewComment(e.target.value)} />
              <button type="submit" className="bg-black text-white px-3 py-1 rounded text-sm">Kirim</button>
            </form>
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="border-b pb-2">
                  <p className="text-sm font-medium">{c.user.nama}</p>
                  <p className="text-sm text-gray-700">{c.isi}</p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-gray-500 text-sm">Belum ada komentar.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="font-semibold mb-2 text-sm text-gray-500">Materi</h2>
            {pdfChapters.length > 1 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {pdfChapters.map((ch) => (
                  <button key={ch.id} onClick={() => setActivePdfId(ch.id)}
                    className={`text-xs px-3 py-1 rounded ${activePdfId === ch.id ? 'bg-black text-white' : 'bg-gray-100'}`}>
                    {ch.judul}
                  </button>
                ))}
              </div>
            )}
            {pdfChapters.length === 0 && <p className="text-gray-400 text-sm">Modul ini tidak punya bab materi PDF.</p>}
            {pdfChapters.length > 0 && (
              !pdfData ? <p className="text-gray-500 text-sm">Memuat materi...</p> :
              pdfData.pdfUrl ? (
                <iframe src={`${pdfData.pdfUrl}#toolbar=0`} className="w-full border rounded" style={{ height: '60vh' }} title="Materi PDF" />
              ) : <p className="text-gray-500 text-sm">Materi belum tersedia.</p>
            )}
          </div>

          <div>
            <h2 className="font-semibold mb-2 text-sm text-gray-500">Latihan Soal</h2>
            {soalChapters.length > 1 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {soalChapters.map((ch) => (
                  <button key={ch.id} onClick={() => setActiveSoalId(ch.id)}
                    className={`text-xs px-3 py-1 rounded ${activeSoalId === ch.id ? 'bg-black text-white' : 'bg-gray-100'}`}>
                    {ch.judul}
                  </button>
                ))}
              </div>
            )}
            {soalChapters.length === 0 && <p className="text-gray-400 text-sm">Modul ini tidak punya bab latihan soal.</p>}
            {soalChapters.length > 0 && (
              !soalData ? <p className="text-gray-500 text-sm">Memuat soal...</p> :
              currentQuestion ? (
                <div className={`border rounded p-4 ${currentQuestion.sudahBenar ? 'bg-green-50 border-green-300' : ''}`}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-500">Soal {qIndex + 1} dari {questions.length}</p>
                    {currentQuestion.sudahBenar && (
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Sudah pernah benar</span>
                    )}
                  </div>
                  {currentQuestion.questionText && <p className="mb-3">{currentQuestion.questionText}</p>}
                  {currentQuestion.questionImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentQuestion.questionImageUrl} alt="Soal" className="mb-3 max-w-full rounded" />
                  )}
                  <div className="space-y-2">
                    {currentQuestion.options.map((opt) => (
                      <button key={opt.id} onClick={() => handleAnswer(currentQuestion.id, opt.id)}
                        className="w-full text-left border rounded p-3 hover:bg-gray-50 bg-white">
                        <b>{opt.urutan}.</b> {opt.konten}
                      </button>
                    ))}
                  </div>
                  {feedback && <p className="mt-3 font-medium">{feedback}</p>}
                  <div className="flex justify-between mt-4">
                    <button disabled={qIndex === 0} onClick={() => { setQIndex(qIndex - 1); setFeedback(null); }}
                      className="text-sm text-gray-600 disabled:opacity-30">Sebelumnya</button>
                    <button disabled={qIndex >= questions.length - 1} onClick={() => { setQIndex(qIndex + 1); setFeedback(null); }}
                      className="text-sm text-blue-600 disabled:opacity-30">Selanjutnya</button>
                  </div>
                </div>
              ) : <p className="text-gray-500 text-sm">Tidak ada soal di bab ini.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}