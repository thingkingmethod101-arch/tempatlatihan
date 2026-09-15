'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface SkillNode { id: string; nama: string; }
interface TierConfig { id: string; nama: string; }
interface OptionDraft { urutan: string; konten: string; isCorrect: boolean; }
interface QuestionDraft { questionImageUrl: string; previewUrl: string; options: OptionDraft[]; }

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

function emptyQuestion(): QuestionDraft {
  return {
    questionImageUrl: '', previewUrl: '',
    options: [
      { urutan: 'A', konten: '', isCorrect: true },
      { urutan: 'B', konten: '', isCorrect: false },
      { urutan: 'C', konten: '', isCorrect: false },
      { urutan: 'D', konten: '', isCorrect: false },
    ],
  };
}

export default function MyContentPage() {
  const [skillNodes, setSkillNodes] = useState<SkillNode[]>([]);
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const [step, setStep] = useState(0);

  const [judul, setJudul] = useState('');
  const [skillNodeId, setSkillNodeId] = useState('');
  const [tierId, setTierId] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [durasiBulan, setDurasiBulan] = useState(3);
  const [harga, setHarga] = useState(50000);

  const [pdfFileAssetId, setPdfFileAssetId] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [jumlahBab, setJumlahBab] = useState(1);
  const [soalBabs, setSoalBabs] = useState<{ judul: string; questions: QuestionDraft[] }[]>([{ judul: 'Bab 1', questions: [] }]);
  const [jumlahBabInput, setJumlahBabInput] = useState('1');

  // ==== BARU: Video YouTube ====
  const [videoUrl, setVideoUrl] = useState('');

  // ==== BARU: Harga per paket (kalau ada video) ====
  const [hargaVideo, setHargaVideo] = useState(40000);
  const [hargaMateri, setHargaMateri] = useState(30000);
  const [hargaBundle, setHargaBundle] = useState(50000);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [thumbnailFileAssetId, setThumbnailFileAssetId] = useState('');
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editJudul, setEditJudul] = useState('');
  const [editDeskripsi, setEditDeskripsi] = useState('');

  // punyaVideo: dipakai untuk menentukan apakah tampilkan 1 harga atau 3 harga paket
  const punyaVideo = videoUrl.trim().length > 0;
  

  function loadContents() {
    apiFetch('/contents/mine').then(setContents).catch(() => {});
  }

  useEffect(() => {
    loadContents();
    apiFetch('/skill-nodes', { auth: false }).then(setSkillNodes).catch(() => {});
    apiFetch('/tier-configs', { auth: false }).then(setTiers).catch(() => {});
  }, []);

  function resetForm() {
    setStep(0);
    setJudul(''); setSkillNodeId(''); setTierId(''); setDeskripsi('');
    setDurasiBulan(3); setHarga(50000);
    setPdfFileAssetId(''); setPdfFileName('');
    setJumlahBab(1); setSoalBabs([{ judul: 'Bab 1', questions: [] }]);
    setThumbnailFileAssetId('');
    setVideoUrl('');
    setHargaVideo(40000); setHargaMateri(30000); setHargaBundle(50000);
  }

  async function handleUploadPdf(file: File) {
    setPdfFileName(file.name);
    setUploadingKey('pdf');
    try {
      const id = await uploadFile(file, 'materi_konten');
      setPdfFileAssetId(id);

      const thumbBlob = await generateThumbnailFromPdf(file);
      if (thumbBlob) {
        const thumbFile = new File([thumbBlob], 'sampul.png', { type: 'image/png' });
        const thumbId = await uploadFile(thumbFile, 'thumbnail_konten');
        setThumbnailFileAssetId(thumbId);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal upload PDF');
    } finally {
      setUploadingKey(null);
    }
  }

  function handleUbahJumlahBab(jumlah: number) {
    setJumlahBab(jumlah);
    setSoalBabs((prev) => {
      const next = [...prev];
      while (next.length < jumlah) next.push({ judul: `Bab ${next.length + 1}`, questions: [] });
      while (next.length > jumlah) next.pop();
      return next;
    });
  }

  function updateBabJudul(babIndex: number, judul: string) {
    setSoalBabs((prev) => prev.map((b, i) => (i === babIndex ? { ...b, judul } : b)));
  }

  function addQuestionToBab(babIndex: number) {
    setSoalBabs((prev) => prev.map((b, i) => (i === babIndex ? { ...b, questions: [...b.questions, emptyQuestion()] } : b)));
  }

  function removeQuestionFromBab(babIndex: number, qIndex: number) {
    setSoalBabs((prev) => prev.map((b, i) => (i === babIndex ? { ...b, questions: b.questions.filter((_, qi) => qi !== qIndex) } : b)));
  }

  function updateQuestionInBab(babIndex: number, qIndex: number, patch: Partial<QuestionDraft>) {
    setSoalBabs((prev) => prev.map((b, i) =>
      i === babIndex ? { ...b, questions: b.questions.map((q, qi) => (qi === qIndex ? { ...q, ...patch } : q)) } : b
    ));
  }

  async function handleUploadQuestionImageInBab(babIndex: number, qIndex: number, file: File) {
    const localPreview = URL.createObjectURL(file);
    updateQuestionInBab(babIndex, qIndex, { previewUrl: localPreview });
    setUploadingKey(`img-${babIndex}-${qIndex}`);
    try {
      const id = await uploadFile(file, 'soal_gambar');
      updateQuestionInBab(babIndex, qIndex, { questionImageUrl: id });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal upload gambar soal');
    } finally {
      setUploadingKey(null);
    }
  }

  function updateOptionInBab(babIndex: number, qIndex: number, optIndex: number, konten: string) {
    setSoalBabs((prev) => prev.map((b, i) => {
      if (i !== babIndex) return b;
      const questions = b.questions.map((q, qi) => {
        if (qi !== qIndex) return q;
        const options = [...q.options];
        options[optIndex] = { ...options[optIndex], konten };
        return { ...q, options };
      });
      return { ...b, questions };
    }));
  }

  function setCorrectOptionInBab(babIndex: number, qIndex: number, optIndex: number) {
    setSoalBabs((prev) => prev.map((b, i) => {
      if (i !== babIndex) return b;
      const questions = b.questions.map((q, qi) => {
        if (qi !== qIndex) return q;
        return { ...q, options: q.options.map((o, oi) => ({ ...o, isCorrect: oi === optIndex })) };
      });
      return { ...b, questions };
    }));
  }

  async function handleRequestDelete(id: string) {
    if (!confirm('Ajukan permohonan hapus modul ini ke admin?')) return;
    try {
      await apiFetch(`/contents/${id}/request-delete`, { method: 'POST' });
      loadContents();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal mengajukan hapus');
    }
  }

  async function handleSubmitAll() {
    setSubmitting(true);
    setMessage(null);

    if (!deskripsi.trim()) {
      setMessage('Deskripsi modul wajib diisi.');
      setSubmitting(false);
      return;
    }

    try {
      const chapters: any[] = [];
      let urutan = 1;      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');

      

      function startEditContent(c: any) {
        setEditingContentId(c.id);
        setEditJudul(c.judul || '');
        setEditDeskripsi(c.deskripsi || '');
      }
    
      async function handleSaveEdit(id: string) {
        try {
          await apiFetch(`/contents/${id}/edit`, { method: 'PATCH', body: { judul: editJudul, deskripsi: editDeskripsi } });
          setEditingContentId(null);
          loadContents();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : 'Gagal simpan perubahan');
        }
      }

      if (!context) return null;

      await page.render({ canvasContext: context, viewport }).promise;
      return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
    } catch {
      return null;
    }
  }

      if (pdfFileAssetId) {
        chapters.push({
          judul: 'Materi',
          urutan: urutan++,
          isFree: true,
          tipe: 'viewer_pdf',
          materiFileAssetId: pdfFileAssetId,
        });
      }

      for (const bab of soalBabs) {
        if (bab.questions.length === 0) continue;
        chapters.push({
          judul: bab.judul,
          urutan: urutan++,
          isFree: true,
          tipe: 'latihan_soal',
          questions: bab.questions.map((q) => ({
            questionImageUrl: q.questionImageUrl || undefined,
            options: q.options.map((o) => ({ urutan: o.urutan, tipe: 'teks', konten: o.konten, isCorrect: o.isCorrect })),
          })),
        });
      }

      // ==== BARU: bab video ====
      if (punyaVideo) {
        chapters.push({
          judul: 'Video Pembelajaran',
          urutan: urutan++,
          isFree: false,
          tipe: 'video_youtube',
          videoUrl: videoUrl.trim(),
        });
      }

      if (chapters.length === 0) {
        setMessage('Isi minimal 1: materi PDF, soal latihan, atau video.');
        setSubmitting(false);
        return;
      }

      // ==== BARU: pricing beda tergantung ada video atau tidak ====
      const pricing = punyaVideo
        ? [
            { durasiBulan, harga: hargaVideo, paket: 'video' },
            { durasiBulan, harga: hargaMateri, paket: 'materi' },
            { durasiBulan, harga: hargaBundle, paket: 'bundle' },
          ]
        : [{ durasiBulan, harga }];

      await apiFetch('/contents', {
        method: 'POST',
        body: { judul, skillNodeId, tierId, deskripsi, thumbnailFileAssetId: thumbnailFileAssetId || undefined, pricing, chapters },
      });

      setMessage('Modul berhasil dibuat! Menunggu moderasi admin.');
      resetForm();
      loadContents();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal membuat modul');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteContent(id: string) {
    if (!confirm('Hapus modul ini permanen? Semua data terkait ikut terhapus.')) return;
    try {
      await apiFetch(`/contents/${id}`, { method: 'DELETE' });
      loadContents();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal hapus modul');
    }
  }

  function startEditContent(c: any) {
    setEditingContentId(c.id);
    setEditJudul(c.judul || '');
    setEditDeskripsi(c.deskripsi || '');
  }

  async function handleSaveEdit(id: string) {
    try {
      await apiFetch(`/contents/${id}/edit`, { method: 'PATCH', body: { judul: editJudul, deskripsi: editDeskripsi } });
      setEditingContentId(null);
      loadContents();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal simpan perubahan');
    }
  }

  async function generateThumbnailFromPdf(file: File): Promise<Blob | null> {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.2 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');

      if (!context) return null;

      await page.render({ canvasContext: context, viewport, canvas }).promise;
      return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
    } catch {
      return null;
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Konten Saya</h1>
      {message && <p className="text-sm mb-4 bg-blue-50 border border-blue-200 p-2 rounded">{message}</p>}

      {step === 0 && (
        <div className="border rounded p-4 mb-6 space-y-2">
          <h2 className="font-semibold mb-2">Buat Modul Baru — Langkah 1: Info Dasar, Materi PDF &amp; Video</h2>

          <input className="w-full border p-2 rounded" placeholder="Judul modul (contoh: Matematika Dasar Kelas 7)"
            value={judul} onChange={(e) => setJudul(e.target.value)} required />
          
          <div className="pt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mau Buat Berapa Bab Latihan Soal?</label>
            <input type="number" min={1} className="w-full border p-2 rounded"
              value={jumlahBabInput}
              onChange={(e) => {
                const raw = e.target.value;
                setJumlahBabInput(raw);
                const parsed = Number(raw);
                if (raw !== '' && parsed >= 1) {
                  handleUbahJumlahBab(parsed);
                }
              }}
              onBlur={() => {
                if (jumlahBabInput === '' || Number(jumlahBabInput) < 1) {
                  setJumlahBabInput('1');
                  handleUbahJumlahBab(1);
                }
              }}
            />
          </div>

          <select className="w-full border p-2 rounded" value={skillNodeId} onChange={(e) => setSkillNodeId(e.target.value)}>
            <option value="">Pilih Skill Node</option>
            {skillNodes.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
          </select>

          <select className="w-full border p-2 rounded" value={tierId} onChange={(e) => setTierId(e.target.value)}>
            <option value="">Pilih Tier (untuk soal latihan di modul ini)</option>
            {tiers.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
          </select>

          <textarea className="w-full border p-2 rounded" placeholder="Deskripsi modul — WAJIB diisi (maks. sekitar 250 kata)"
            value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} maxLength={1500} required />
          <p className="text-xs text-gray-400">{deskripsi.split(/\s+/).filter(Boolean).length} kata (perkiraan)</p>

          <div className="pt-2">
            <label className="block text-xs text-gray-500 mb-1">Materi PDF (opsional — bisa dikosongkan)</label>
            <input type="file" accept="application/pdf"
              onChange={(e) => e.target.files?.[0] && handleUploadPdf(e.target.files[0])}
              disabled={uploadingKey === 'pdf'}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700" />
            {pdfFileName && (
              <p className="text-sm mt-1 font-medium">
                {pdfFileName}{' '}
                {pdfFileAssetId
                  ? <span className="text-green-700">Upload beres!</span>
                  : <span className="text-orange-600">Sedang upload, harap bersabar...</span>}
              </p>
            )}
          </div>

          {/* ==== BARU: Input Video YouTube ==== */}
          <div className="pt-2">
            <label className="block text-xs text-gray-500 mb-1">Video YouTube: PASTIKAN SET VIDEO ANDA MENJADI UNLISTED! CEK TUTORIAL INI: https://www.youtube.com/watch?v=wWieXfsQi58 (opsional — kosongkan kalau modul ini tidak ada video)</label>
            <input className="w-full border p-2 rounded" placeholder="https://youtube.com/watch?v=..."
              value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </div>

          {/* ==== BARU: Harga — berubah bentuk kalau ada video ==== */}
          {!punyaVideo ? (
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Durasi Sewa (Bulan)</label>
              <input type="number" className="w-full border p-2 rounded"
              value={durasiBulan=== 0 ? '' : durasiBulan} onChange={(e) => setDurasiBulan(Number(e.target.value))} />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Harga (Rp, 0 = Gratis)</label>
              <input type="number" className="w-full border p-2 rounded"
                value={harga === 0 ? '' : harga} onChange={(e) => setHarga(Number(e.target.value))} />
            </div>
          </div>
          ) : (
            <div className="space-y-2 border rounded p-3 mt-2">
              <p className="text-sm font-semibold">Atur Harga per Paket (karena ada video)</p>
              <div className="flex items-center gap-2">
                <span className="w-28 text-sm">Video Saja</span>
                <input type="number" className="flex-1 border p-2 rounded" placeholder="Harga (Rp)"
                  value={hargaVideo=== 0 ? '' : hargaVideo} onChange={(e) => setHargaVideo(Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-28 text-sm">Materi (PDF+Soal)</span>
                <input type="number" className="flex-1 border p-2 rounded" placeholder="Harga (Rp)"
                  value={hargaMateri=== 0 ? '' : hargaMateri} onChange={(e) => setHargaMateri(Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-28 text-sm">Bundle (Semua)</span>
                <input type="number" className="flex-1 border p-2 rounded" placeholder="Harga (Rp)"
                  value={hargaBundle=== 0 ? '' : hargaBundle} onChange={(e) => setHargaBundle(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Durasi Sewa (Bulan) — Berlaku untuk Semua Paket</label>
                <input type="number" className="w-full border p-2 rounded"
                  value={durasiBulan=== 0 ? '' : durasiBulan} onChange={(e) => setDurasiBulan(Number(e.target.value))} />
            </div>
            </div>
          )}

          <button onClick={() => setStep(1)} disabled={!judul || !skillNodeId || !tierId || !deskripsi.trim()}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50 mt-2">
            Lanjut ke Soal Latihan →
          </button>
        </div>
      )}

{step === 1 && (
        <div className="border rounded p-4 mb-6 space-y-4">
          <h2 className="font-semibold">Langkah 2: Soal Latihan per Bab</h2>
          {pdfFileName && (
            <p className="text-xs text-gray-500">Materi PDF: {pdfFileName} {pdfFileAssetId ? '(sudah terupload)' : '(masih upload...)'}</p>
          )}
          {punyaVideo && <p className="text-xs text-gray-500">Video: sudah diisi ✓</p>}

          {soalBabs.map((bab, babIndex) => (
            <div key={babIndex} className="border-2 rounded p-3 bg-gray-50">
              <input className="w-full border p-2 rounded font-semibold mb-3"
                value={bab.judul} onChange={(e) => updateBabJudul(babIndex, e.target.value)} placeholder={`Judul Bab ${babIndex + 1}`} />

              {bab.questions.map((q, qIndex) => (
                <div key={qIndex} className="border rounded p-3 bg-white mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">Soal {qIndex + 1}</p>
                    <button onClick={() => removeQuestionFromBab(babIndex, qIndex)} className="text-xs text-red-600 underline">Hapus</button>
                  </div>
                  <label className="block text-xs text-gray-500 mb-1">Format yang diterima: JPG atau PNG</label>
                  <input type="file" accept="image/png,image/jpeg"
                    onChange={(e) => e.target.files?.[0] && handleUploadQuestionImageInBab(babIndex, qIndex, e.target.files[0])}
                    disabled={uploadingKey === `img-${babIndex}-${qIndex}`}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700" />

                  {q.previewUrl && (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={q.previewUrl} alt="Preview soal" className="max-w-xs rounded border" />
                      <p className="text-sm mt-1 font-medium">
                        {q.questionImageUrl
                          ? <span className="text-green-700">Upload beres!</span>
                          : <span className="text-orange-600">Sedang upload, harap bersabar...</span>}
                      </p>
                    </div>
                  )}

                  <div className="mt-2 space-y-1">
                    {q.options.map((opt, optIndex) => (
                      <div key={opt.urutan} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${babIndex}-${qIndex}`} checked={opt.isCorrect}
                          onChange={() => setCorrectOptionInBab(babIndex, qIndex, optIndex)} />
                        <span className="text-sm w-4">{opt.urutan}</span>
                        <input className="flex-1 border p-1 rounded text-sm" placeholder={`Jawaban ${opt.urutan}`}
                          value={opt.konten}
                          onChange={(e) => updateOptionInBab(babIndex, qIndex, optIndex, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button onClick={() => addQuestionToBab(babIndex)} className="text-sm text-blue-600 underline">+ Tambah Soal ke {bab.judul}</button>
            </div>
          ))}

          <div className="flex justify-between pt-3">
            <button onClick={() => setStep(0)} className="text-sm text-gray-600">← Kembali</button>
            <button onClick={handleSubmitAll} disabled={submitting}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
              {submitting ? 'Menyimpan...' : 'Selesai & Simpan Modul'}
            </button>
          </div>
        </div>
      )}

      <h2 className="font-semibold mb-2">Modul yang Sudah Dibuat</h2>
      <div className="space-y-3">
      {contents.map((c: any) => (
          <div key={c.id} className="border rounded p-4">
            {editingContentId === c.id ? (
              <div className="space-y-2">
                <input className="w-full border p-2 rounded text-sm" value={editJudul} onChange={(e) => setEditJudul(e.target.value)} placeholder="Judul" />
                <textarea className="w-full border p-2 rounded text-sm" value={editDeskripsi} onChange={(e) => setEditDeskripsi(e.target.value)} placeholder="Deskripsi" />
                <div className="flex gap-2">
                  <button onClick={() => handleSaveEdit(c.id)} className="bg-black text-white px-3 py-1 rounded text-sm">Simpan</button>
                  <button onClick={() => setEditingContentId(null)} className="text-sm text-gray-600">Batal</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <p className="font-medium">{c.judul || 'Modul Tanpa Judul'}</p>
                <div className="flex items-center gap-2">
                  <span className={
                    'text-xs px-2 py-1 rounded ' +
                    (c.statusModerasi === 'disetujui' ? 'bg-green-100 text-green-700' :
                     c.statusModerasi === 'ditolak' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')
                  }>
                    {c.statusModerasi}
                  </span>
                  <button onClick={() => startEditContent(c)} className="text-blue-600 underline text-xs">Edit</button>
                  {isAdmin ? (
                    <button onClick={() => handleDeleteContent(c.id)} className="text-red-600 underline text-xs">Hapus</button>
                  ) : c.deleteRequestedAt ? (
                    <span className="text-xs text-orange-600">Menunggu persetujuan hapus</span>
                  ) : (
                    <button onClick={() => handleRequestDelete(c.id)} className="text-orange-600 underline text-xs">Ajukan Hapus</button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {contents.length === 0 && <p className="text-gray-500">Belum ada modul.</p>}
      </div>
    </div>
  );
}
