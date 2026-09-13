'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface PoolItem { id: string; question: { id: string; questionText: string | null } }
interface QuestionItem { id: string; questionText: string | null; statusModerasi: string }
interface RankedAttempt {
  id: string;
  userId: string;
  nama: string;
  kontak: string;
  skorFinal100: number | null;
  durasiPengerjaanDetik: number | null;
  submittedAt: string;
  statusBayar: 'gratis' | 'sudah_bayar' | 'belum_bayar';
  ranking: number;
  gelar: string | null;
}
interface SessionItem { id: string; waktuMulai: string; waktuSelesai: string; kuota: number; terisi: number; }
interface Participant { userId: string; nama: string; kontak: string; }

function formatDurasi(seconds: number | null): string {
  if (seconds == null) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

function formatWaktuWIB(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) + ' WIB';
}

function toWaNumber(kontak: string): string | null {
  const digits = kontak.replace(/\D/g, '');
  if (digits.length < 9) return null;
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('62')) return digits;
  return digits;
}

const STATUS_LABEL: Record<string, string> = { gratis: 'Gratis', sudah_bayar: 'Sudah Bayar', belum_bayar: 'Belum Bayar' };
const STATUS_COLOR: Record<string, string> = {
  gratis: 'bg-gray-100 text-gray-600',
  sudah_bayar: 'bg-green-100 text-green-700',
  belum_bayar: 'bg-red-100 text-red-700 cursor-pointer hover:bg-red-200',
};

export default function AdminRoundPage() {
  const params = useParams();
  const roundId = params.roundId as string;

  const [pool, setPool] = useState<PoolItem[]>([]);
  const [approvedQuestions, setApprovedQuestions] = useState<QuestionItem[]>([]);
  const [rankedAttempts, setRankedAttempts] = useState<RankedAttempt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [unlockingUserId, setUnlockingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [unassigned, setUnassigned] = useState<Participant[]>([]);
  const [assignedMap, setAssignedMap] = useState<Record<string, Participant[]>>({});
  const [sessionForm, setSessionForm] = useState({ waktuMulai: '', waktuSelesai: '', kuota: 50 });
  const [creatingSession, setCreatingSession] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<Record<string, string>>({});
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ waktuMulai: '', waktuSelesai: '', kuota: 50 });

  function load() {
    apiFetch(`/event-rounds/${roundId}/questions`).then(setPool).catch((e) => setError(e.message));
    apiFetch('/questions')
      .then((data: QuestionItem[]) => setApprovedQuestions(data.filter((q) => q.statusModerasi === 'disetujui')))
      .catch(() => {});
    apiFetch(`/event-rounds/${roundId}/attempts`).then(setRankedAttempts).catch(() => {});
    apiFetch(`/event-rounds/${roundId}/sessions`).then(loadSessionsAndAssignments).catch(() => {});
    apiFetch(`/event-rounds/${roundId}/unassigned-participants`).then(setUnassigned).catch(() => {});
  }

  function startEdit(s: SessionItem) {
    setEditingSessionId(s.id);
    setEditForm({
      waktuMulai: s.waktuMulai.slice(0, 16),
      waktuSelesai: s.waktuSelesai.slice(0, 16),
      kuota: s.kuota,
    });
  }

  async function handleUpdateSession(sessionId: string) {
    try {
      await apiFetch(`/event-sessions/${sessionId}`, { method: 'PATCH', body: editForm });
      setEditingSessionId(null);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal ubah sesi');
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm('Hapus sesi ini? Semua peserta yang sudah dijadwalkan di sesi ini akan ikut terhapus jadwalnya.')) return;
    try {
      await apiFetch(`/event-sessions/${sessionId}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal hapus sesi');
    }
  }

  async function loadSessionsAndAssignments(sessionList: SessionItem[]) {
    setSessions(sessionList);
    const map: Record<string, Participant[]> = {};
    for (const s of sessionList) {
      map[s.id] = await apiFetch(`/event-sessions/${s.id}/assigned`);
    }
    setAssignedMap(map);
  }

  useEffect(() => { load(); }, [roundId]);

  async function handleAdd(questionId: string) {
    setAddingId(questionId);
    try {
      await apiFetch(`/event-rounds/${roundId}/questions`, { method: 'POST', body: { questionId } });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menambahkan soal');
    } finally {
      setAddingId(null);
    }
  }

  async function handleUnlock(userId: string) {
    setUnlockingUserId(userId);
    setMessage(null);
    try {
      await apiFetch(`/event-rounds/${roundId}/unlock-attempt/${userId}`, { method: 'POST' });
      setMessage('Kunci dibuka — siswa bisa mengulang babak ini sekali.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal membuka kunci');
    } finally {
      setUnlockingUserId(null);
    }
  }

  function handleReminderClick(attempt: RankedAttempt) {
    if (attempt.statusBayar !== 'belum_bayar') return;
    const nomor = toWaNumber(attempt.kontak);
    if (!nomor) {
      alert(`Kontak "${attempt.kontak}" bukan format nomor WA yang valid. Perbaiki dulu datanya di Prisma Studio.`);
      return;
    }
    const pesan = encodeURIComponent(
      `Halo ${attempt.nama}, ini pengingat untuk segera melunasi pembayaran babak ini. Terima kasih — Admin TempatLatihan.com.`
    );
    window.open(`https://wa.me/${nomor}?text=${pesan}`, '_blank');
  }

  if (error) return <p className="text-red-600">{error}</p>;

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setCreatingSession(true);
    try {
      await apiFetch(`/event-rounds/${roundId}/sessions`, { method: 'POST', body: sessionForm });
      setSessionForm({ waktuMulai: '', waktuSelesai: '', kuota: 50 });
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal membuat sesi');
    } finally {
      setCreatingSession(false);
    }
  }

  async function handleAssign(sessionId: string) {
    const userId = selectedUserId[sessionId];
    if (!userId) return;
    try {
      await apiFetch(`/event-sessions/${sessionId}/assign`, { method: 'POST', body: { userId } });
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal menambahkan peserta ke sesi (mungkin kuota penuh)');
    }
  }

  async function handleUnassign(sessionId: string, userId: string) {
    await apiFetch(`/event-sessions/${sessionId}/assign/${userId}`, { method: 'DELETE' });
    load();
  }

  async function handleFinalisasiJuara() {
    if (!confirm('Finalisasi peringkat juara sekarang? Ini akan menghitung ulang Juara 1-3 dan Harapan 1-3 berdasarkan semua peserta yang sudah selesai sampai saat ini.')) return;
    try {
      await apiFetch(`/event-rounds/${roundId}/finalize-ranking`, { method: 'POST' });
      setMessage('Peringkat juara berhasil difinalisasi.');
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal finalisasi peringkat');
    }
  }

  function handleKirimJadwalWa(session: SessionItem, peserta: Participant) {
    const nomor = toWaNumber(peserta.kontak);
    if (!nomor) {
      alert(`Kontak "${peserta.kontak}" bukan format nomor WA yang valid. Perbaiki dulu datanya di Prisma Studio.`);
      return;
    }
    const waktu = formatWaktuWIB(session.waktuMulai);
    const pesan = encodeURIComponent(
      `Halo ${peserta.nama}, jadwal kamu untuk babak ini adalah ${waktu} (selesai ${formatWaktuWIB(session.waktuSelesai)}). ` +
      `Mohon standby tepat waktu ya. Terima kasih — Admin TempatLatihan.com.`
    );
    window.open(`https://wa.me/${nomor}?text=${pesan}`, '_blank');
  }

  const poolQuestionIds = new Set(pool.map((p) => p.question.id));

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Kurasi Soal Babak</h1>

      <h2 className="font-semibold mb-2">Soal di Pool ({pool.length})</h2>
      <ul className="mb-6 space-y-1">
        {pool.map((p) => (
          <li key={p.id} className="text-sm border rounded p-2">{p.question.questionText}</li>
        ))}
        {pool.length === 0 && <p className="text-gray-500 text-sm">Belum ada soal di babak ini.</p>}
      </ul>

      <h2 className="font-semibold mb-2">Soal Tersedia (disetujui)</h2>
      <div className="space-y-2 mb-6">
        {approvedQuestions
          .filter((q) => !poolQuestionIds.has(q.id))
          .map((q) => (
            <div key={q.id} className="border rounded p-2 flex justify-between items-center">
              <span className="text-sm">{q.questionText}</span>
              <button
                disabled={addingId === q.id}
                onClick={() => handleAdd(q.id)}
                className="bg-black text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                {addingId === q.id ? '...' : 'Tambah'}
              </button>
            </div>
          ))}
        {approvedQuestions.filter((q) => !poolQuestionIds.has(q.id)).length === 0 && (
          <p className="text-gray-500 text-sm">Tidak ada soal disetujui yang belum masuk pool.</p>
        )}
      </div>

      <h2 className="font-semibold mb-2">Penjadwalan (Kuota Sesi)</h2>
        <p className="text-xs text-gray-500 mb-2">
          Siswa TIDAK bisa melihat jam sesi ini lewat aplikasi — kirim manual lewat tombol WA di bawah kalau perlu.
        </p>

        <form onSubmit={handleCreateSession} className="border rounded p-3 mb-4 flex gap-2 items-end flex-wrap">
          <div>
            <label className="block text-xs text-gray-500">Mulai</label>
            <input type="datetime-local" className="border p-1 rounded text-sm"
              value={sessionForm.waktuMulai}
              onChange={(e) => setSessionForm({ ...sessionForm, waktuMulai: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Selesai</label>
            <input type="datetime-local" className="border p-1 rounded text-sm"
              value={sessionForm.waktuSelesai}
              onChange={(e) => setSessionForm({ ...sessionForm, waktuSelesai: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Kuota</label>
            <input type="number" className="border p-1 rounded text-sm w-20"
              value={sessionForm.kuota}
              onChange={(e) => setSessionForm({ ...sessionForm, kuota: Number(e.target.value) })} required />
          </div>
          <button type="submit" disabled={creatingSession} className="bg-black text-white px-3 py-1.5 rounded text-sm disabled:opacity-50">
            {creatingSession ? '...' : 'Buat Sesi'}
          </button>
        </form>

        <div className="space-y-3 mb-6">
          {sessions.map((s) => (
            <div key={s.id} className="border rounded p-3">
            {editingSessionId === s.id ? (
              <div className="border-b pb-2 mb-2 flex gap-2 items-end flex-wrap">
                <div>
                  <label className="block text-xs text-gray-500">Mulai</label>
                  <input type="datetime-local" className="border p-1 rounded text-sm"
                    value={editForm.waktuMulai}
                    onChange={(e) => setEditForm({ ...editForm, waktuMulai: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Selesai</label>
                  <input type="datetime-local" className="border p-1 rounded text-sm"
                    value={editForm.waktuSelesai}
                    onChange={(e) => setEditForm({ ...editForm, waktuSelesai: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Kuota</label>
                  <input type="number" className="border p-1 rounded text-sm w-20"
                    value={editForm.kuota}
                    onChange={(e) => setEditForm({ ...editForm, kuota: Number(e.target.value) })} />
                </div>
                <button onClick={() => handleUpdateSession(s.id)} className="bg-black text-white px-3 py-1 rounded text-sm">
                  Simpan
                </button>
                <button onClick={() => setEditingSessionId(null)} className="text-sm text-gray-600">
                  Batal
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">
                  {formatWaktuWIB(s.waktuMulai)} — {formatWaktuWIB(s.waktuSelesai)}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{s.terisi}/{s.kuota} terisi</span>
                  <button onClick={() => startEdit(s)} className="text-xs text-blue-600 underline">Edit</button>
                  <button onClick={() => handleDeleteSession(s.id)} className="text-xs text-red-600 underline">Hapus</button>
                </div>
              </div>
            )}

              <div className="flex gap-2 mb-2">
                <select className="flex-1 border p-1 rounded text-sm"
                  value={selectedUserId[s.id] ?? ''}
                  onChange={(e) => setSelectedUserId({ ...selectedUserId, [s.id]: e.target.value })}>
                  <option value="">Pilih peserta belum terjadwal...</option>
                  {unassigned.map((p) => <option key={p.userId} value={p.userId}>{p.nama}</option>)}
                </select>
                <button onClick={() => handleAssign(s.id)} className="bg-black text-white px-3 py-1 rounded text-sm">
                  Tambahkan
                </button>
              </div>

              <div className="space-y-1">
                {(assignedMap[s.id] ?? []).map((p) => (
                  <div key={p.userId} className="flex justify-between items-center text-sm bg-gray-50 px-2 py-1 rounded">
                    <span>{p.nama} <span className="text-xs text-gray-400">({p.kontak})</span></span>
                    <div className="flex gap-2">
                      <button onClick={() => handleKirimJadwalWa(s, p)} className="text-green-700 text-xs underline">
                        Kirim Jadwal WA
                      </button>
                      <button onClick={() => handleUnassign(s.id, p.userId)} className="text-red-600 text-xs underline">
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}

                {(assignedMap[s.id] ?? []).length === 0 && <p className="text-xs text-gray-400">Belum ada peserta di sesi ini.</p>}
              </div>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-gray-500 text-sm">Belum ada sesi. Babak ini masih bebas diakses kapan saja.</p>}
        </div>


      <h2 className="font-semibold mb-2">Peserta &amp; Ranking</h2>
      <p className="text-xs text-gray-500 mb-2">
        Diurutkan skor tertinggi dulu, kalau sama → waktu tercepat menang. Klik baris <b>Belum Bayar</b> untuk kirim pengingat WhatsApp.
      </p>
      {message && <p className="text-sm text-blue-700 mb-2">{message}</p>}

      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold">Peserta &amp; Ranking</h2>
        <button onClick={handleFinalisasiJuara} className="bg-black text-white px-3 py-1.5 rounded text-sm">
          Finalisasi Juara
        </button>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Nama</th>
              <th className="py-2 pr-2">Skor</th>
              <th className="py-2 pr-2">Waktu Pengerjaan</th>
              <th className="py-2 pr-2">Selesai (WIB)</th>
              <th className="py-2 pr-2">Note</th>
              <th className="py-2 pr-2">Aksi</th>
              <th className="py-2 pr-2">Gelar</th>
            </tr>
          </thead>
          <tbody>
            {rankedAttempts.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="py-2 pr-2 font-semibold">{a.ranking}</td>
                <td className="py-2 pr-2">
                  <p className="font-medium">{a.nama}</p>
                  <p className="text-xs text-gray-500">{a.kontak}</p>
                </td>
                <td className="py-2 pr-2">{a.skorFinal100 ?? '-'}</td>
                <td className="py-2 pr-2">{formatDurasi(a.durasiPengerjaanDetik)}</td>
                <td className="py-2 pr-2 text-xs">{formatWaktuWIB(a.submittedAt)}</td>
                <td className="py-2 pr-2 font-semibold">{a.gelar ?? '-'}</td>
                <td className="py-2 pr-2">
                
                  <span
                    onClick={() => handleReminderClick(a)}
                    className={`text-xs px-2 py-1 rounded ${STATUS_COLOR[a.statusBayar]}`}
                  >
                    {STATUS_LABEL[a.statusBayar]}
                  </span>
                </td>
                <td className="py-2 pr-2">
                  <button
                    disabled={unlockingUserId === a.userId}
                    onClick={() => handleUnlock(a.userId)}
                    className="bg-yellow-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                  >
                    {unlockingUserId === a.userId ? '...' : 'Reset/Ulang'}
                  </button>
                </td>
              </tr>
            ))}
            {rankedAttempts.length === 0 && (
              <tr><td colSpan={7} className="text-gray-500 text-sm py-3">Belum ada peserta yang selesai.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}