'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
interface KodeAkun { id: string; kode: string; nama: string; }
interface RingkasanKode { kodeAkun: string; nama: string; tipe: string; total: number; jumlahEntri: number; }

interface LedgerRow {
  id: string;
  sumber: 'manual' | 'transaksi';
  tanggal: string;
  keterangan: string;
  tipe: string;
  jumlah: number;
  buktiUrl: string | null;
}

async function uploadFile(file: File, purpose: string): Promise<string> {
  const presign = await apiFetch('/files/presign', { method: 'POST', body: { purpose, mimeType: file.type, sizeBytes: file.size } });
  await fetch(presign.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  const confirmed = await apiFetch('/files/confirm', { method: 'POST', body: { path: presign.path, purpose, mimeType: file.type, sizeBytes: file.size } });
  return confirmed.id;
}

export default function PembukuanPage() {
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingRowId, setUploadingRowId] = useState<string | null>(null);

  const [keterangan, setKeterangan] = useState('');
  const [tipe, setTipe] = useState('keluar');
  const [jumlah, setJumlah] = useState('');
  const [buktiFileAssetId, setBuktiFileAssetId] = useState('');
  const [buktiFileName, setBuktiFileName] = useState('');

  const rowUploadTarget = useRef<{ sumber: 'manual' | 'transaksi'; id: string } | null>(null);
  const rowFileInputRef = useRef<HTMLInputElement>(null);

  const [kodeAkunList, setKodeAkunList] = useState<KodeAkun[]>([]);
  const [ringkasan, setRingkasan] = useState<RingkasanKode[]>([]);
  const [kodeAkunTerpilih, setKodeAkunTerpilih] = useState('');
  const [kodeBaru, setKodeBaru] = useState('');
  const [namaKodeBaru, setNamaKodeBaru] = useState('');

  function loadKodeAkun() {
    apiFetch('/ledger/kode-akun').then(setKodeAkunList).catch(() => {});
    apiFetch('/ledger/ringkasan-kode-akun').then(setRingkasan).catch(() => {});
  }

  function load() {
    apiFetch('/ledger').then(setRows).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); loadKodeAkun(); }, []);

  async function handleUploadBukti(file: File) {
    setBuktiFileName(file.name);
    setUploading(true);
    try {
      const id = await uploadFile(file, 'bukti_pembukuan');
      setBuktiFileAssetId(id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal upload bukti');
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      await apiFetch('/ledger', {
        method: 'POST',
        body: { keterangan, tipe, jumlah: Number(jumlah), buktiFileAssetId: buktiFileAssetId || undefined, kodeAkun: kodeAkunTerpilih || undefined },
      });
      setKeterangan('');
      setJumlah('');
      setBuktiFileAssetId('');
      setBuktiFileName('');
      setMessage('Catatan berhasil ditambahkan.');
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal menambahkan catatan');
    } finally {
      setCreating(false);
    }
  }

  function triggerRowUpload(row: LedgerRow) {
    rowUploadTarget.current = { sumber: row.sumber, id: row.id };
    rowFileInputRef.current?.click();
  }

  async function handleRowFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const target = rowUploadTarget.current;
    if (!file || !target) return;
    setUploadingRowId(target.id);
    try {
      const fileAssetId = await uploadFile(file, 'bukti_pembukuan');
      await apiFetch('/ledger/attach-bukti', {
        method: 'PATCH',
        body: { sumber: target.sumber, id: target.id, buktiFileAssetId: fileAssetId },
      });
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal upload bukti untuk baris ini');
    } finally {
      setUploadingRowId(null);
      e.target.value = '';
    }
  }

  async function handleTambahKodeAkun() {
    if (!kodeBaru || !namaKodeBaru) return;
    await apiFetch('/ledger/kode-akun', { method: 'POST', body: { kode: kodeBaru, nama: namaKodeBaru } });
    setKodeBaru('');
    setNamaKodeBaru('');
    loadKodeAkun();
  }

  async function handleHapusKodeAkun(id: string) {
    if (!confirm('Hapus kode akun ini dari tabel referensi?')) return;
    await apiFetch(`/ledger/kode-akun/${id}`, { method: 'DELETE' });
    loadKodeAkun();
  }

  async function handleDownloadExcel() {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ledger/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal download Excel');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pembukuan-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal download Excel');
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;

  const totalMasuk = rows.filter((r) => r.tipe === 'masuk').reduce((s, r) => s + r.jumlah, 0);
  const totalKeluar = rows.filter((r) => r.tipe === 'keluar').reduce((s, r) => s + r.jumlah, 0);

  return (
    <div className="max-w-3xl">
      <input ref={rowFileInputRef} type="file" accept="application/pdf,image/png,image/jpeg" className="hidden" onChange={handleRowFileSelected} />

      <div className="no-print">
        <h1 className="text-2xl font-bold mb-4">Pembukuan</h1>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="border rounded p-3 bg-green-50">
            <p className="text-xs text-gray-500">Total Uang Masuk</p>
            <p className="text-lg font-bold text-green-700">Rp{totalMasuk.toLocaleString('id-ID')}</p>
          </div>
          <div className="border rounded p-3 bg-red-50">
            <p className="text-xs text-gray-500">Total Uang Keluar</p>
            <p className="text-lg font-bold text-red-700">Rp{totalKeluar.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div>
            <label className="block text-xs text-gray-500 mb-1">Kode Akun (opsional)</label>
            <select className="w-full border p-2 rounded text-sm" value={kodeAkunTerpilih} onChange={(e) => setKodeAkunTerpilih(e.target.value)}>
              <option value="">Tanpa kode akun</option>
              {kodeAkunList.map((k) => <option key={k.id} value={k.kode}>{k.kode} — {k.nama}</option>)}
            </select>
          </div>

        <form onSubmit={handleCreate} className="border rounded p-4 mb-6 space-y-2">
          <h2 className="font-semibold">Tambah Catatan Manual</h2>
          <input className="w-full border p-2 rounded text-sm" placeholder="Keterangan (mis. Biaya hosting bulan ini)"
            value={keterangan} onChange={(e) => setKeterangan(e.target.value)} required />
          <div className="flex gap-2">
            <select className="border p-2 rounded text-sm" value={tipe} onChange={(e) => setTipe(e.target.value)}>
              <option value="keluar">Uang Keluar</option>
              <option value="masuk">Uang Masuk (lain-lain)</option>
            </select>
            <input type="number" className="flex-1 border p-2 rounded text-sm" placeholder="Jumlah (Rp)"
              value={jumlah} onChange={(e) => setJumlah(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bukti (PDF atau gambar)</label>
            <input type="file" accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => e.target.files?.[0] && handleUploadBukti(e.target.files[0])}
              disabled={uploading}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700" />
            {buktiFileName && (
              <p className="text-sm mt-1 font-medium">
              {buktiFileName}{' '}
              {buktiFileAssetId
                ? <span className="text-green-700">[OK] Upload beres!</span>
                : <span className="text-orange-600">[...] Sedang upload, harap bersabar...</span>}
            </p>
            )}
          </div>
          <button type="submit" disabled={creating} className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50">
            {creating ? 'Menyimpan...' : 'Tambah Catatan'}
          </button>
          {message && <p className="text-sm">{message}</p>}
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-2">Tanggal</th>
              <th className="py-2 pr-2">Keterangan</th>
              <th className="py-2 pr-2">Kode Akun</th>
              <th className="py-2 pr-2">Tipe</th>
              <th className="py-2 pr-2">Jumlah</th>
              <th className="py-2 pr-2 text-right">Bukti</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.sumber}-${r.id}`} className="border-b">
                <td className="py-2 pr-2 text-xs">{r.tanggal ? new Date(r.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                <td className="py-2 pr-2">
                  {r.keterangan}
                  {r.sumber === 'transaksi' && <span className="ml-2 text-xs text-gray-400">(otomatis)</span>}
                </td>
                <td className="py-2 pr-2 font-mono text-xs">{(r as any).kodeAkun ?? '-'}</td>
                <td className="py-2 pr-2">
                  <span className={`text-xs px-2 py-1 rounded ${r.tipe === 'masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.tipe === 'masuk' ? 'Masuk' : 'Keluar'}
                  </span>
                </td>
                <td className="py-2 pr-2 font-medium">Rp{r.jumlah.toLocaleString('id-ID')}</td>
                <td className="py-2 pr-2 text-right">
                  {r.buktiUrl ? (
                    <a href={r.buktiUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">
                      Lihat Bukti
                    </a>
                  ) : (
                    <button
                      onClick={() => triggerRowUpload(r)}
                      disabled={uploadingRowId === r.id}
                      className="text-xs text-blue-600 underline disabled:opacity-50"
                    >
                      {uploadingRowId === r.id ? 'Mengupload...' : '+ Upload Bukti'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="text-gray-500 text-sm py-3">Belum ada catatan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="no-print border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Tabel Referensi Kode Akun</h2>
        <p className="text-xs text-gray-500 mb-3">Isi arti tiap kode akun di sini (contoh: 4.1.1 = Biaya Server & Hosting).</p>
        <div className="flex gap-2 mb-3">
          <input className="border p-2 rounded text-sm w-32" placeholder="Kode (mis: 4.1.1)" value={kodeBaru} onChange={(e) => setKodeBaru(e.target.value)} />
          <input className="border p-2 rounded text-sm flex-1" placeholder="Nama/arti kode ini" value={namaKodeBaru} onChange={(e) => setNamaKodeBaru(e.target.value)} />
          <button onClick={handleTambahKodeAkun} className="bg-black text-white px-3 py-2 rounded text-sm">Tambah</button>
        </div>
        <div className="space-y-1">
          {kodeAkunList.map((k) => (
            <div key={k.id} className="flex justify-between text-sm border-b py-1">
              <span><b className="font-mono">{k.kode}</b> — {k.nama}</span>
              <button onClick={() => handleHapusKodeAkun(k.id)} className="text-xs text-red-600 underline">Hapus</button>
            </div>
          ))}
          {kodeAkunList.length === 0 && <p className="text-xs text-gray-400">Belum ada kode akun didefinisikan.</p>}
        </div>
      </div>

      <div className="no-print border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Ringkasan per Kode Akun (Terbesar Dulu)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-1">Kode</th>
              <th className="py-1">Kategori</th>
              <th className="py-1">Tipe</th>
              <th className="py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {ringkasan.map((r) => (
              <tr key={r.kodeAkun} className="border-b">
                <td className="py-1 font-mono">{r.kodeAkun}</td>
                <td className="py-1">{r.nama}</td>
                <td className="py-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${r.tipe === 'masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.tipe === 'masuk' ? 'Masuk' : 'Keluar'}
                  </span>
                </td>
                <td className="py-1 text-right font-medium">Rp{r.total.toLocaleString('id-ID')}</td>
              </tr>
            ))}
            {ringkasan.length === 0 && <tr><td colSpan={4} className="text-gray-400 text-sm py-2">Belum ada entri dengan kode akun.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="no-print mt-4 flex gap-2">
        <button onClick={() => window.print()} className="bg-black text-white px-4 py-2 rounded text-sm">
          Cetak / Simpan sebagai PDF
        </button>
        <button onClick={handleDownloadExcel} className="bg-green-600 text-white px-4 py-2 rounded text-sm">
          Download Excel
        </button>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}