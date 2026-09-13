'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface SkillNode { id: string; nama: string; }
interface TierConfig { id: string; nama: string; }
interface QuestionItem { id: string; questionText: string | null; statusModerasi: string; }

async function uploadFile(file: File, purpose: string): Promise<string> {
  const presign = await apiFetch('/files/presign', {
    method: 'POST',
    body: { purpose, mimeType: file.type, sizeBytes: file.size },
  });
  await fetch(presign.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  const confirmed = await apiFetch('/files/confirm', {
    method: 'POST',
    body: { path: presign.path, purpose, mimeType: file.type, sizeBytes: file.size },
  });
  return confirmed.id;
}

export default function MyQuestionsPage() {
  const [skillNodes, setSkillNodes] = useState<SkillNode[]>([]);
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [skillNodeId, setSkillNodeId] = useState('');
  const [tierId, setTierId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionImageUrl, setQuestionImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [options, setOptions] = useState([
    { urutan: 'A', konten: '', isCorrect: true, tipe: 'teks' },
    { urutan: 'B', konten: '', isCorrect: false, tipe: 'teks' },
    { urutan: 'C', konten: '', isCorrect: false, tipe: 'teks' },
    { urutan: 'D', konten: '', isCorrect: false, tipe: 'teks' },
  ]);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  function load() {
    apiFetch('/questions/me').then(setQuestions).catch(() => {});
  }

  useEffect(() => {
    load();
    apiFetch('/skill-nodes', { auth: false }).then(setSkillNodes).catch(() => {});
    apiFetch('/tier-configs', { auth: false }).then(setTiers).catch(() => {});
  }, []);

  async function handleUploadImage(file: File) {
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const id = await uploadFile(file, 'soal_gambar');
      setQuestionImageUrl(id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal upload gambar');
    } finally {
      setUploading(false);
    }
  }

  function updateOption(index: number, konten: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, konten } : o)));
  }

  function setCorrect(index: number) {
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      await apiFetch('/questions', {
        method: 'POST',
        body: {
          skillNodeId,
          tierId,
          questionType: questionImageUrl ? 'gambar' : 'teks',
          questionText: questionText || undefined,
          questionImageUrl: questionImageUrl || undefined,
          options,
        },
      });
      setMessage('Soal berhasil dibuat, menunggu moderasi admin.');
      setQuestionText('');
      setQuestionImageUrl('');
      setPreviewUrl('');
      setOptions([
        { urutan: 'A', konten: '', isCorrect: true, tipe: 'teks' },
        { urutan: 'B', konten: '', isCorrect: false, tipe: 'teks' },
        { urutan: 'C', konten: '', isCorrect: false, tipe: 'teks' },
        { urutan: 'D', konten: '', isCorrect: false, tipe: 'teks' },
      ]);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal membuat soal');
    } finally {
      setCreating(false);
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

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Soal Saya</h1>

      <div className="border rounded p-4 mb-6">
        <h2 className="font-semibold mb-3">Tambah Soal Baru</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <select className="w-full border p-2 rounded" value={skillNodeId} onChange={(e) => setSkillNodeId(e.target.value)} required>
            <option value="">Pilih Skill Node</option>
            {skillNodes.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
          </select>

          <select className="w-full border p-2 rounded" value={tierId} onChange={(e) => setTierId(e.target.value)} required>
            <option value="">Pilih Tier</option>
            {tiers.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
          </select>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Gambar Soal (opsional — upload gambar ATAU tulis teks di bawah)</label>
            <input type="file" accept="image/png,image/jpeg"
              onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0])}
              disabled={uploading}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700" />
            {previewUrl && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview soal" className="max-w-xs rounded border" />
                <p className="text-xs mt-1">
                  {questionImageUrl ? <span className="text-green-700">✓ Terupload ke server</span> : <span className="text-gray-400">Mengupload...</span>}
                </p>
              </div>
            )}
          </div>

          <textarea className="w-full border p-2 rounded" placeholder="Pertanyaan (opsional kalau sudah pakai gambar)"
            value={questionText} onChange={(e) => setQuestionText(e.target.value)} />

          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={opt.urutan} className="flex items-center gap-2">
                <input type="radio" checked={opt.isCorrect} onChange={() => setCorrect(i)} />
                <input className="flex-1 border p-2 rounded" placeholder={`Opsi ${opt.urutan}`}
                  value={opt.konten} onChange={(e) => updateOption(i, e.target.value)} required />
              </div>
            ))}
          </div>

          <button type="submit" disabled={creating} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
            {creating ? 'Membuat...' : 'Tambah Soal'}
          </button>
          {message && <p className="text-sm">{message}</p>}
        </form>
      </div>

      <h2 className="font-semibold mb-2">Riwayat Soal</h2>
      <div className="space-y-2">
        {questions.map((q) => (
          <div key={q.id} className="border rounded p-3 flex justify-between items-center">
            <span className="text-sm">{q.questionText || '[Soal bergambar]'}</span>
            <div className="flex items-center gap-2">
              <span className={
                'text-xs px-2 py-1 rounded ' +
                (q.statusModerasi === 'disetujui' ? 'bg-green-100 text-green-700' :
                 q.statusModerasi === 'ditolak' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')
              }>
                {q.statusModerasi}
              </span>
              {isAdmin && (
                <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-600 underline text-xs">
                  Hapus
                </button>
              )}
            </div>
          </div>
        ))}
        {questions.length === 0 && <p className="text-gray-500 text-sm">Belum ada soal.</p>}
      </div>
    </div>
  );
}