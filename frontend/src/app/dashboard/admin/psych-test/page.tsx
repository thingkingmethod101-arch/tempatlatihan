'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface OptionDraft { teks: string; bobotText: string; }
interface QuestionItem {
  id: string;
  teks: string;
  allowMultiple: boolean;
  options: { id: string; teks: string; bobot: Record<string, number> }[];
}

function parseBobot(text: string): Record<string, number> {
  const result: Record<string, number> = {};
  text.split(',').forEach((pair) => {
    const [key, val] = pair.split(':').map((s) => s.trim());
    if (key && val) result[key] = Number(val);
  });
  return result;
}

export default function AdminPsychTestPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [teks, setTeks] = useState('');
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [options, setOptions] = useState<OptionDraft[]>([{ teks: '', bobotText: '' }]);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingJson, setUploadingJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    apiFetch('/psych-test/questions/admin').then(setQuestions).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  function addOption() {
    setOptions([...options, { teks: '', bobotText: '' }]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      await apiFetch('/psych-test/questions', {
        method: 'POST',
        body: {
          teks,
          allowMultiple,
          urutan: questions.length + 1,
          options: options.map((o) => ({ teks: o.teks, bobot: parseBobot(o.bobotText) })),
        },
      });
      setMessage('Pertanyaan berhasil dibuat.');
      setTeks('');
      setOptions([{ teks: '', bobotText: '' }]);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal membuat pertanyaan');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus pertanyaan ini? Data jawaban siswa yang pernah pakai pertanyaan ini tidak akan terhapus, tapi pertanyaannya tidak akan muncul lagi.')) return;
    try {
      await apiFetch(`/psych-test/questions/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal hapus pertanyaan');
    }
  }

  async function handleJsonUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingJson(true);
    setMessage(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await apiFetch('/psych-test/questions/bulk-upload', { method: 'POST', body: parsed });
      setMessage(`Berhasil: ${res.berhasil} dari ${res.totalDiproses} pertanyaan. ${res.gagal.length > 0 ? `Gagal: ${res.gagal.length}.` : ''}`);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? `Gagal: ${err.message}` : 'File JSON tidak valid');
    } finally {
      setUploadingJson(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Kelola Tes Psikometri</h1>

      <form onSubmit={handleCreate} className="border rounded p-4 mb-6 space-y-3">
      <div className="border rounded p-4 mb-4 bg-blue-50">
        <h2 className="font-semibold mb-2">Upload Sekaligus (File JSON)</h2>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleJsonUpload} disabled={uploadingJson}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700" />
        <p className="text-xs text-gray-400 mt-2">Sabar ya tunggu sampai pertanyaan bisa diproses! Cek bagian bawah sendiri!</p>
      </div>
        <h2 className="font-semibold">Tambah Pertanyaan</h2>
        <textarea className="w-full border p-2 rounded" placeholder="Teks pertanyaan"
          value={teks} onChange={(e) => setTeks(e.target.value)} required />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)} />
          Boleh pilih lebih dari satu jawaban
        </label>

        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="border rounded p-2 space-y-1">
              <input className="w-full border p-1 rounded text-sm" placeholder={`Teks opsi ${i + 1}`}
                value={opt.teks}
                onChange={(e) => setOptions(options.map((o, idx) => idx === i ? { ...o, teks: e.target.value } : o))} />
              <input className="w-full border p-1 rounded text-sm" placeholder="Bobot, mis: riasec_A:2, mapel_biologi:1"
                value={opt.bobotText}
                onChange={(e) => setOptions(options.map((o, idx) => idx === i ? { ...o, bobotText: e.target.value } : o))} />
            </div>
          ))}
        </div>
        <button type="button" onClick={addOption} className="text-sm text-blue-600 underline">
          + Tambah Opsi
        </button>

        <button type="submit" disabled={creating} className="block w-full bg-black text-white py-2 rounded disabled:opacity-50">
          {creating ? 'Menyimpan...' : 'Simpan Pertanyaan'}
        </button>
        {message && <p className="text-sm">{message}</p>}
      </form>

      <h2 className="font-semibold mb-2">Daftar Pertanyaan ({questions.length})</h2>
      <div className="space-y-2">
        {questions.map((q) => (
          <div key={q.id} className="border rounded p-3 text-sm">
            <div className="flex justify-between items-start">
              <p className="font-medium">{q.teks} {q.allowMultiple && '(multi-jawaban)'}</p>
              <button onClick={() => handleDelete(q.id)} className="text-xs text-red-600 underline shrink-0 ml-2">
                Hapus
              </button>
            </div>
            <ul className="text-gray-500 ml-4 list-disc">
              {q.options.map((o) => (
                <li key={o.id}>{o.teks} — {JSON.stringify(o.bobot)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}