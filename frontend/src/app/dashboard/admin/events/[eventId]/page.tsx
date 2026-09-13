'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Round { id: string; namaBabak: string; isFree: boolean; isFinal: boolean; durasiMenit: number; urutan: number; passingGrade: number | null; }
interface EventDetail { id: string; nama: string; status: string; rounds: Round[]; }
interface TierConfig { id: string; nama: string; }

export default function AdminEventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [roundForm, setRoundForm] = useState({ namaBabak: '', tierId: '', isFree: true, isFinal: false, biaya: '', durasiMenit: 30, urutan: 1, passingGrade: '', });
  const [creatingRound, setCreatingRound] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [grupWaLink, setGrupWaLink] = useState('');
  const [savingWa, setSavingWa] = useState(false);



  function load() {
    apiFetch(`/events/${eventId}`).then(setEvent).catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
    apiFetch('/tier-configs', { auth: false }).then(setTiers).catch(() => {});
  }, [eventId]);

  useEffect(() => {
    if (event && (event as any).grupWaLink) setGrupWaLink((event as any).grupWaLink);
  }, [event]);

  async function handleSaveGrupWa() {
    setSavingWa(true);
    try {
      await apiFetch(`/events/${eventId}/grup-wa`, { method: 'PATCH', body: { grupWaLink } });
      setMessage('Link grup WA tersimpan.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal menyimpan link');
    } finally {
      setSavingWa(false);
    }
  }

  async function handleCreateRound(e: React.FormEvent) {
    e.preventDefault();
    setCreatingRound(true);
    setMessage(null);
    try {
      await apiFetch(`/events/${eventId}/rounds`, {
        method: 'POST',
        body: { ...roundForm, biaya: roundForm.biaya === '' ? 0 : Number(roundForm.biaya) },
      });
      setMessage('Babak berhasil dibuat.');
      setRoundForm({ namaBabak: '', tierId: '', isFree: true, isFinal: false, biaya: '', durasiMenit: 30, urutan: 1, passingGrade: '' });
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal membuat babak');
    } finally {
      setCreatingRound(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await apiFetch(`/events/${eventId}/publish`, { method: 'PATCH' });
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal publish');
    } finally {
      setPublishing(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!event) return <p>Memuat...</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{event.nama}</h1>
        <span className={
          'text-xs px-2 py-1 rounded ' +
          (event.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')
        }>
          {event.status}
        </span>
      </div>

      {event.status !== 'published' && (
        <button onClick={handlePublish} disabled={publishing}
          className="mb-6 bg-black text-white px-4 py-2 rounded disabled:opacity-50">
          {publishing ? 'Memproses...' : 'Publish Event'}
        </button>
      )}

      <div className="border rounded p-4 mb-6 space-y-2">
        <h2 className="font-semibold">Link Grup WhatsApp Event</h2>
        <p className="text-xs text-gray-500">Ditampilkan otomatis ke peserta yang statusnya sudah terdaftar/lunas.</p>
        <div className="flex gap-2">
          <input className="flex-1 border p-2 rounded text-sm" placeholder="https://chat.whatsapp.com/..."
            value={grupWaLink} onChange={(e) => setGrupWaLink(e.target.value)} />
          <button onClick={handleSaveGrupWa} disabled={savingWa} className="bg-black text-white px-3 py-2 rounded text-sm disabled:opacity-50">
            {savingWa ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>


      <h2 className="font-semibold mb-2">Babak</h2>
      <div className="space-y-2 mb-6">
        {event.rounds.map((r) => (
          <div key={r.id} className="border rounded p-3 flex justify-between items-center">
            <span>
              #{r.urutan} — {r.namaBabak} {r.isFinal && <span className="text-yellow-600">(Final)</span>}
              {' '}· {r.durasiMenit} menit · {r.isFree ? 'Gratis' : 'Berbayar'}
              {r.passingGrade != null && <span className="text-gray-500"> · Passing grade: {r.passingGrade}</span>}
            </span>
            <Link href={`/dashboard/admin/rounds/${r.id}`} className="text-blue-600 underline text-sm">
              Kurasi Soal
            </Link>
          </div>
        ))}
          
        {event.rounds.length === 0 && <p className="text-gray-500 text-sm">Belum ada babak.</p>}
      </div>

      <form onSubmit={handleCreateRound} className="border rounded p-4 space-y-2">
        <h2 className="font-semibold">Tambah Babak</h2>
        <div className="flex gap-2">
          <input type="number" min={1} className="w-1/2 border p-2 rounded" placeholder="Urutan babak (1, 2, 3, ...)"
            value={roundForm.urutan}
            onChange={(e) => setRoundForm({ ...roundForm, urutan: Number(e.target.value) })} required />
          <input type="number" min={0} max={100} className="w-1/2 border p-2 rounded" placeholder="Passing grade (kosongkan jika babak terakhir)"
            value={roundForm.passingGrade}
            onChange={(e) => setRoundForm({ ...roundForm, passingGrade: e.target.value })} />
        </div>
        <input className="w-full border p-2 rounded" placeholder="Nama babak"
          value={roundForm.namaBabak} onChange={(e) => setRoundForm({ ...roundForm, namaBabak: e.target.value })} required />
        <select className="w-full border p-2 rounded" value={roundForm.tierId}
          onChange={(e) => setRoundForm({ ...roundForm, tierId: e.target.value })} required>
          <option value="">Pilih Tier</option>
          {tiers.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
        </select>
        <input type="number" className="w-full border p-2 rounded" placeholder="Durasi (menit)"
          value={roundForm.durasiMenit}
          onChange={(e) => setRoundForm({ ...roundForm, durasiMenit: Number(e.target.value) })} required />
        <input type="number" className="w-full border p-2 rounded" placeholder="Biaya (Rp, kosongkan jika gratis)"
          value={roundForm.biaya}
          onChange={(e) => setRoundForm({ ...roundForm, biaya: e.target.value })} />        
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={roundForm.isFree}
            onChange={(e) => setRoundForm({ ...roundForm, isFree: e.target.checked })} />
          Gratis
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={roundForm.isFinal}
            onChange={(e) => setRoundForm({ ...roundForm, isFinal: e.target.checked })} />
          Babak Final (memicu sertifikat otomatis)
        </label>
        <button type="submit" disabled={creatingRound} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
          {creatingRound ? 'Membuat...' : 'Tambah Babak'}
        </button>
        {message && <p className="text-sm">{message}</p>}


      </form>
    </div>
  );
}